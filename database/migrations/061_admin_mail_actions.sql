begin;

-- Returns the stored HTML body of a mail outbox entry for admin preview.
create or replace function app_public.admin_get_mail_content(p_mail_id uuid)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  return (
    select html_body
    from app_private.mail_outbox
    where id = p_mail_id
  );
end;
$$;

grant execute on function app_public.admin_get_mail_content(uuid) to admin;
revoke all on function app_public.admin_get_mail_content(uuid) from public;
comment on function app_public.admin_get_mail_content(uuid) is
  '@name adminGetMailContent
Returns the stored HTML body of a mail outbox entry. Admin only.';

-- Resets a mail outbox entry to pending for re-delivery via the same scheduled mailing routine.
create or replace function app_public.admin_resend_mail(p_mail_id uuid)
returns void
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can resend mail';
  end if;

  update app_private.mail_outbox
  set
    status = 'pending',
    failure_reason = null,
    attempts = 0,
    last_attempt_at = null,
    updated_at = now()
  where id = p_mail_id;

  if not found then
    raise exception using message = 'Mail not found';
  end if;
end;
$$;

grant execute on function app_public.admin_resend_mail(uuid) to admin;
revoke all on function app_public.admin_resend_mail(uuid) from public;
comment on function app_public.admin_resend_mail(uuid) is
  '@name adminResendMail
Resets a mail outbox entry to pending for re-delivery via the same scheduled mailing routine. Admin only.';

commit;
