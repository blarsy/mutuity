begin;

-- Add preferred language preference to accounts
alter table app_public.account
  add column if not exists preferred_language text not null default 'en'
  check (preferred_language in ('en', 'fr'));

comment on column app_public.account.preferred_language is
  'The account owner''s preferred UI and email language. Supported values: en, fr.';

-- Add locale column to mail_outbox to persist language at queue time
alter table app_private.mail_outbox
  add column if not exists locale text not null default 'en';

comment on column app_private.mail_outbox.locale is
  'The locale used to render the email, captured from the account''s preferred_language at queue time.';

-- Replace queue_mail_outbox to capture the account's preferred language into the outbox row
create or replace function app_private.queue_mail_outbox(
  p_account_id uuid,
  p_mail_kind text,
  p_auth_token text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_email text;
  v_mail_id uuid;
  v_locale text;
begin
  if nullif(btrim(p_mail_kind), '') is null then
    return null;
  end if;

  select c.login_identifier, coalesce(a.preferred_language, 'en')
  into v_email, v_locale
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where c.account_id = p_account_id
    and c.is_active = true
  order by c.created_at asc
  limit 1;

  if nullif(btrim(v_email), '') is null then
    return null;
  end if;

  insert into app_private.mail_outbox (
    account_id,
    recipient_email,
    mail_kind,
    auth_token,
    metadata,
    locale
  )
  values (
    p_account_id,
    lower(v_email),
    p_mail_kind,
    p_auth_token,
    coalesce(p_metadata, '{}'::jsonb),
    v_locale
  )
  returning id into v_mail_id;

  return v_mail_id;
end;
$$;

-- Replace claim_pending_mail_outbox to return the locale field
drop function if exists app_private.claim_pending_mail_outbox(uuid, integer);

create or replace function app_private.claim_pending_mail_outbox(
  p_mail_id uuid default null,
  p_batch_size integer default 25
)
returns table (
  id uuid,
  recipient_email text,
  mail_kind text,
  auth_token text,
  locale text
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  return query
  with candidate as (
    select mo.id
    from app_private.mail_outbox mo
    where mo.status = 'pending'
      and (p_mail_id is null or mo.id = p_mail_id)
    order by mo.created_at asc
    limit greatest(1, coalesce(p_batch_size, 25))
    for update skip locked
  ),
  updated as (
    update app_private.mail_outbox mo
    set status = 'processing',
        updated_at = now()
    from candidate c
    where mo.id = c.id
    returning mo.id, mo.recipient_email, mo.mail_kind, mo.auth_token, mo.locale, mo.created_at
  )
  select u.id, u.recipient_email, u.mail_kind, u.auth_token, u.locale
  from updated u
  order by u.created_at asc;
end;
$$;

grant execute on function app_private.claim_pending_mail_outbox(uuid, integer)
  to identified_account, manager, admin;

comment on function app_private.claim_pending_mail_outbox(uuid, integer) is
  'Atomically claims pending outbox mails by switching them to processing and returns rows to deliver, including the locale.';

revoke all on function app_private.claim_pending_mail_outbox(uuid, integer) from public;

commit;
