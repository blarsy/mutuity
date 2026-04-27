begin;

-- Add audit logging to admin_resend_mail.
create or replace function app_public.admin_resend_mail(p_mail_id uuid)
returns void
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_admin_account_id uuid;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can resend mail';
  end if;

  v_admin_account_id := app_private.current_account_id();

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

  perform app_private.write_operational_log(
    'info',
    'web_api',
    format('[admin] mail resent: mail_id=%s by account_id=%s', p_mail_id, v_admin_account_id),
    'admin_resend_mail',
    v_admin_account_id
  );
end;
$$;

-- Add audit logging to add_campaign_moderation_note.
create or replace function app_public.add_campaign_moderation_note(
  campaign_id uuid,
  body text
)
returns app_public.campaign_moderation_note
language plpgsql
as $$
declare
  v_note app_public.campaign_moderation_note;
  v_manager_account_id uuid;
  v_campaign_status app_public.campaign_moderation_status;
begin
  if not app_private.is_manager() then
    raise exception using message = 'Only managers can add moderation notes';
  end if;

  v_manager_account_id := app_private.current_account_id();

  if v_manager_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select moderation_status
  into v_campaign_status
  from app_public.campaign
  where id = add_campaign_moderation_note.campaign_id;

  if v_campaign_status is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign_status <> 'pending' then
    raise exception using message = 'Moderation notes are allowed only for pending campaigns';
  end if;

  if length(trim(body)) = 0 then
    raise exception using message = 'Moderation note body is required';
  end if;

  insert into app_public.campaign_moderation_note (
    campaign_id,
    manager_account_id,
    body
  )
  values (
    add_campaign_moderation_note.campaign_id,
    v_manager_account_id,
    trim(add_campaign_moderation_note.body)
  )
  returning * into v_note;

  perform app_private.write_operational_log(
    'info',
    'web_api',
    format('[admin] campaign moderation note added: campaign_id=%s by account_id=%s', add_campaign_moderation_note.campaign_id, v_manager_account_id),
    'add_campaign_moderation_note',
    v_manager_account_id
  );

  return v_note;
end;
$$;

comment on function app_public.add_campaign_moderation_note(uuid, text)
  is '@name addCampaignModerationNote';

-- Add audit logging to upsert_grant (create path only, when p_grant_id is null).
create or replace function app_public.upsert_grant(
  p_grant_id uuid,
  p_title text,
  p_description text,
  p_awarded_token_amount integer,
  p_max_successful_claim_count integer default null,
  p_expires_at timestamptz default null,
  p_linked_campaign_id uuid default null,
  p_archived_at timestamptz default null
)
returns app_public.grant_definition
language plpgsql
set search_path = app_public, app_private, public
as $$
declare
  v_admin_account_id uuid;
  v_result app_public.grant_definition;
  v_is_create boolean;
begin
  v_admin_account_id := app_private.current_account_id();
  v_is_create := p_grant_id is null;

  v_result := app_private.upsert_grant_definition(
    p_grant_id,
    p_title,
    p_description,
    p_awarded_token_amount,
    p_max_successful_claim_count,
    p_expires_at,
    p_linked_campaign_id,
    p_archived_at
  );

  if v_is_create then
    perform app_private.write_operational_log(
      'info',
      'web_api',
      format('[admin] grant created: grant_id=%s title=%s by account_id=%s', v_result.id, p_title, v_admin_account_id),
      'upsert_grant',
      v_admin_account_id
    );
  end if;

  return v_result;
end;
$$;

grant execute on function app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz)
  to admin;

comment on function app_public.upsert_grant(uuid, text, text, integer, integer, timestamptz, uuid, timestamptz)
  is '@name upsertGrant
Creates a new grant definition when p_grant_id is null, or updates an existing one. Admin only.';

commit;
