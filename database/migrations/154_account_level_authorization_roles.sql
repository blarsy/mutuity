begin;

-- Authorization belongs to the account, not whichever credential authenticated it.
alter table app_public.account
  add column role_name text not null default 'identified_account';

alter table app_public.account
  add constraint account_role_name_check
  check (role_name in ('identified_account', 'admin'));

-- Preserve existing administrator assignments while moving role authority.
update app_public.account a
set role_name = case
  when c.role_name in ('admin', 'manager') then 'admin'
  else 'identified_account'
end
from app_private.account_credential c
where c.account_id = a.id;

comment on column app_public.account.role_name is E'@omit all\nAccount authorization role. Change manually in the database; changing the role revokes active sessions.';
comment on column app_private.account_credential.role_name is
  'Deprecated compatibility field; app_public.account.role_name is authoritative.';

create or replace function app_private.revoke_account_sessions_on_role_change()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  if old.role_name is distinct from new.role_name then
    update app_private.account_session
    set revoked_at = coalesce(revoked_at, now())
    where account_id = new.id
      and revoked_at is null;
  end if;

  return new;
end;
$$;

revoke all on function app_private.revoke_account_sessions_on_role_change() from public;

drop trigger if exists trg_account_revoke_sessions_on_role_change on app_public.account;
create trigger trg_account_revoke_sessions_on_role_change
  after update of role_name on app_public.account
  for each row
  execute function app_private.revoke_account_sessions_on_role_change();

-- Password login authenticates with the credential, but authorization comes
-- from its owning account.
drop function if exists app_private.find_login_candidate(text);

create or replace function app_private.find_login_candidate(p_identifier text)
returns table (
  account_id uuid,
  display_name text,
  external_subject text,
  avatar_url text,
  password_hash text,
  role_name text,
  email_verified_at timestamptz,
  preferred_language text,
  require_password_reset_on_next_login boolean
)
language sql
stable
as $$
  select
    a.id,
    a.display_name,
    a.external_subject,
    a.avatar_url,
    c.password_hash,
    a.role_name,
    c.email_verified_at,
    a.preferred_language,
    a.require_password_reset_on_next_login
  from app_private.account_credential c
  join app_public.account a on a.id = c.account_id
  where lower(c.login_identifier) = lower(p_identifier)
    and c.is_active = true
  limit 1
$$;

revoke all on function app_private.find_login_candidate(text) from public;

-- Session role remains a snapshot. Updating account.role_name revokes existing
-- sessions; newly created sessions always snapshot the current account role,
-- regardless of the role argument passed by legacy callers.
create or replace function app_private.create_account_session(
  p_account_id uuid,
  p_role_name text,
  p_session_token_hash text,
  p_expires_at timestamptz
)
returns uuid
language sql
as $$
  insert into app_private.account_session (
    account_id,
    role_name,
    session_token_hash,
    expires_at
  )
  select
    a.id,
    a.role_name,
    p_session_token_hash,
    p_expires_at
  from app_public.account a
  where a.id = p_account_id
  returning id
$$;

revoke all on function app_private.create_account_session(uuid, text, text, timestamptz) from public;

-- Notify campaign creators using account-level authorization, including admins
-- that authenticate only through a social identity.
create or replace function app_public.update_campaign_for_moderation(
  p_campaign_id uuid,
  p_title text,
  p_theme text,
  p_description text,
  p_manager_note_from_creator text,
  p_rewards_multiplier integer,
  p_airdrop_amount integer,
  p_start_at timestamptz,
  p_airdrop_at timestamptz,
  p_end_at timestamptz,
  p_image_url text
)
returns app_public.campaign
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_campaign app_public.campaign;
  v_previous_status app_public.campaign_moderation_status;
  v_creator_name text;
  v_admin record;
  v_image_url text;
begin
  v_account_id := app_private.current_account_id();
  v_image_url := nullif(btrim(p_image_url), '');

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign c
  where c.id = p_campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  select a.display_name
  into v_creator_name
  from app_public.account a
  where a.id = v_campaign.creator_account_id;

  if v_campaign.creator_account_id <> v_account_id then
    raise exception using message = 'Only the campaign creator can edit this campaign';
  end if;

  if v_campaign.moderation_status not in ('pending', 'awaiting_adaptation') then
    raise exception using message = 'Campaign can only be edited while pending or awaiting adaptation';
  end if;

  perform app_private.validate_campaign_dates(p_start_at, p_airdrop_at, p_end_at);

  v_previous_status := v_campaign.moderation_status;

  update app_public.campaign
  set
    title = p_title,
    theme = p_theme,
    description = nullif(btrim(p_description), ''),
    manager_note_from_creator = p_manager_note_from_creator,
    rewards_multiplier = p_rewards_multiplier,
    airdrop_amount = p_airdrop_amount,
    start_at = p_start_at,
    airdrop_at = p_airdrop_at,
    end_at = p_end_at,
    image_url = v_image_url
  where id = p_campaign_id
  returning * into v_campaign;

  insert into app_public.campaign_moderation_event (
    campaign_id,
    actor_account_id,
    event_type,
    body
  )
  values (
    v_campaign.id,
    v_account_id,
    'campaign_modified_by_creator',
    coalesce(nullif(trim(p_manager_note_from_creator), ''), 'Campaign updated by creator')
  );

  if v_previous_status = 'awaiting_adaptation' then
    for v_admin in
      select a.id as account_id
      from app_public.account a
      where a.role_name = 'admin'
        and a.id <> v_account_id
    loop
      perform app_private.create_account_notification(
        v_admin.account_id,
        'campaign_creator_adaptation_submitted',
        jsonb_build_object(
          'campaignId', v_campaign.id,
          'campaignName', v_campaign.title,
          'creatorName', coalesce(v_creator_name, '')
        )
      );
    end loop;
  end if;

  return v_campaign;
end;
$$;

grant execute on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) to identified_account, admin;

revoke all on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) from public;

comment on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
) is '@name updateCampaignForModeration';

commit;
