begin;

create or replace function app_private.claim_pending_mail_outbox(
  p_mail_id uuid default null,
  p_batch_size integer default 25
)
returns table (
  id uuid,
  recipient_email text,
  mail_kind text,
  auth_token text
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
    returning mo.id, mo.recipient_email, mo.mail_kind, mo.auth_token, mo.created_at
  )
  select u.id, u.recipient_email, u.mail_kind, u.auth_token
  from updated u
  order by u.created_at asc;
end;
$$;

grant execute on function app_private.claim_pending_mail_outbox(uuid, integer)
  to identified_account, manager, admin;

comment on function app_private.claim_pending_mail_outbox(uuid, integer) is
  'Atomically claims pending outbox mails by switching them to processing and returns rows to deliver.';

revoke all on function app_private.claim_pending_mail_outbox(uuid, integer) from public;

commit;
