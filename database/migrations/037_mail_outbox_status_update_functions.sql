begin;

create or replace function app_private.mark_mail_outbox_sent(
  p_mail_id uuid,
  p_subject text,
  p_text_body text,
  p_html_body text,
  p_provider_message_id text default null
)
returns void
language sql
security definer
set search_path = app_public, app_private, public
as $$
  update app_private.mail_outbox
  set status = 'sent',
      subject = p_subject,
      text_body = p_text_body,
      html_body = p_html_body,
      provider_message_id = p_provider_message_id,
      failure_reason = null,
      attempts = attempts + 1,
      last_attempt_at = now(),
      sent_at = now(),
      updated_at = now()
  where id = p_mail_id;
$$;

create or replace function app_private.mark_mail_outbox_skipped(
  p_mail_id uuid,
  p_subject text,
  p_text_body text,
  p_html_body text
)
returns void
language sql
security definer
set search_path = app_public, app_private, public
as $$
  update app_private.mail_outbox
  set status = 'skipped',
      subject = p_subject,
      text_body = p_text_body,
      html_body = p_html_body,
      provider_message_id = null,
      failure_reason = null,
      attempts = attempts + 1,
      last_attempt_at = now(),
      sent_at = now(),
      updated_at = now()
  where id = p_mail_id;
$$;

create or replace function app_private.mark_mail_outbox_failed(
  p_mail_id uuid,
  p_subject text,
  p_text_body text,
  p_html_body text,
  p_failure_reason text
)
returns void
language sql
security definer
set search_path = app_public, app_private, public
as $$
  update app_private.mail_outbox
  set status = 'failed',
      subject = coalesce(p_subject, subject),
      text_body = coalesce(p_text_body, text_body),
      html_body = coalesce(p_html_body, html_body),
      failure_reason = p_failure_reason,
      attempts = attempts + 1,
      last_attempt_at = now(),
      updated_at = now()
  where id = p_mail_id;
$$;

grant execute on function app_private.mark_mail_outbox_sent(uuid, text, text, text, text)
  to identified_account, manager, admin;
grant execute on function app_private.mark_mail_outbox_skipped(uuid, text, text, text)
  to identified_account, manager, admin;
grant execute on function app_private.mark_mail_outbox_failed(uuid, text, text, text, text)
  to identified_account, manager, admin;

comment on function app_private.mark_mail_outbox_sent(uuid, text, text, text, text) is
  'Marks one outbox email as sent and stores rendered content/provider metadata.';
comment on function app_private.mark_mail_outbox_skipped(uuid, text, text, text) is
  'Marks one outbox email as skipped while persisting rendered content.';
comment on function app_private.mark_mail_outbox_failed(uuid, text, text, text, text) is
  'Marks one outbox email as failed while preserving best-effort rendered content for diagnostics.';

revoke all on function app_private.mark_mail_outbox_sent(uuid, text, text, text, text) from public;
revoke all on function app_private.mark_mail_outbox_skipped(uuid, text, text, text) from public;
revoke all on function app_private.mark_mail_outbox_failed(uuid, text, text, text, text) from public;

commit;
