begin;

create or replace function app_private.get_rendered_mail_outbox(
  p_mail_id uuid
)
returns table (
  subject text,
  text_body text,
  html_body text,
  metadata jsonb
)
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select
    m.subject,
    m.text_body,
    m.html_body,
    m.metadata
  from app_private.mail_outbox m
  where m.id = p_mail_id
  limit 1;
$$;

create or replace function app_private.queue_notification_digest_mail(
  p_account_id uuid,
  p_recipient_email text,
  p_subject text,
  p_text_body text,
  p_html_body text,
  p_locale text,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_mail_id uuid;
begin
  if nullif(btrim(coalesce(p_recipient_email, '')), '') is null then
    return null;
  end if;

  if nullif(btrim(coalesce(p_subject, '')), '') is null then
    return null;
  end if;

  if nullif(btrim(coalesce(p_text_body, '')), '') is null then
    return null;
  end if;

  if nullif(btrim(coalesce(p_html_body, '')), '') is null then
    return null;
  end if;

  if exists (
    select 1
    from app_private.mail_outbox m
    where m.account_id = p_account_id
      and m.mail_kind = 'notification_digest'
      and m.status in ('pending', 'processing')
  ) then
    return null;
  end if;

  insert into app_private.mail_outbox (
    account_id,
    recipient_email,
    mail_kind,
    metadata,
    status,
    subject,
    text_body,
    html_body,
    locale
  )
  values (
    p_account_id,
    lower(btrim(p_recipient_email)),
    'notification_digest',
    coalesce(p_metadata, '{}'::jsonb),
    'pending',
    btrim(p_subject),
    btrim(p_text_body),
    btrim(p_html_body),
    nullif(btrim(p_locale), '')
  )
  returning id into v_mail_id;

  return v_mail_id;
end;
$$;

grant execute on function app_private.get_rendered_mail_outbox(uuid)
  to identified_account, manager, admin;
grant execute on function app_private.queue_notification_digest_mail(uuid, text, text, text, text, text, jsonb)
  to identified_account, manager, admin;

comment on function app_private.get_rendered_mail_outbox(uuid) is
  'Returns the rendered subject, text, HTML, and metadata for one mail outbox row.';
comment on function app_private.queue_notification_digest_mail(uuid, text, text, text, text, text, jsonb) is
  'Queues one notification digest email in the mail outbox when no pending digest email already exists for the account.';

revoke all on function app_private.get_rendered_mail_outbox(uuid) from public;
revoke all on function app_private.queue_notification_digest_mail(uuid, text, text, text, text, text, jsonb) from public;

commit;