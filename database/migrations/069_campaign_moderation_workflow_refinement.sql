begin;

-- Add the intermediate moderation status used when a creator must adapt a campaign.
do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'app_public'
      and t.typname = 'campaign_moderation_status'
      and e.enumlabel = 'awaiting_adaptation'
  ) then
    alter type app_public.campaign_moderation_status add value 'awaiting_adaptation';
  end if;
end;
$$;

-- Persist creator-side campaign modifications as moderation timeline events.
create table if not exists app_public.campaign_moderation_event (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references app_public.campaign(id) on delete cascade,
  actor_account_id uuid not null references app_public.account(id),
  event_type text not null check (event_type in ('campaign_modified_by_creator')),
  body text,
  created_at timestamptz not null default now()
);

create index if not exists campaign_moderation_event_campaign_created_idx
  on app_public.campaign_moderation_event (campaign_id, created_at desc);

alter table app_public.campaign_moderation_event enable row level security;

drop policy if exists campaign_moderation_event_select_policy on app_public.campaign_moderation_event;
create policy campaign_moderation_event_select_policy on app_public.campaign_moderation_event
  for select
  using (
    app_private.is_admin()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists campaign_moderation_event_insert_policy on app_public.campaign_moderation_event;
create policy campaign_moderation_event_insert_policy on app_public.campaign_moderation_event
  for insert
  with check (
    app_private.is_admin()
    or (
      actor_account_id = app_private.current_account_id()
      and exists (
        select 1
        from app_public.campaign c
        where c.id = campaign_id
          and c.creator_account_id = app_private.current_account_id()
      )
    )
  );

grant select, insert on app_public.campaign_moderation_event to identified_account, admin;

-- Restrict direct row updates so creator edits must go through the guarded function below.
drop policy if exists campaign_update_policy on app_public.campaign;
create policy campaign_update_policy on app_public.campaign
  for update
  using (app_private.is_admin())
  with check (app_private.is_admin());

create or replace function app_public.add_campaign_moderation_note(
  campaign_id uuid,
  body text
)
returns app_public.campaign_moderation_note
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_note app_public.campaign_moderation_note;
  v_admin_account_id uuid;
  v_campaign app_public.campaign;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can add moderation notes';
  end if;

  v_admin_account_id := app_private.current_account_id();

  if v_admin_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign
  where id = add_campaign_moderation_note.campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign.moderation_status = 'approved' then
    raise exception using message = 'Moderation notes are not allowed for approved campaigns';
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
    v_admin_account_id,
    trim(add_campaign_moderation_note.body)
  )
  returning * into v_note;

  update app_public.campaign
  set moderation_status = 'awaiting_adaptation'
  where id = v_campaign.id;

  perform app_private.create_account_notification(
    v_campaign.creator_account_id,
    'campaign_moderation_note_received',
    jsonb_build_object(
      'campaignId', v_campaign.id,
      'campaignName', v_campaign.title
    )
  );

  return v_note;
end;
$$;

grant execute on function app_public.add_campaign_moderation_note(uuid, text)
  to admin;

revoke all on function app_public.add_campaign_moderation_note(uuid, text)
  from public;

comment on function app_public.add_campaign_moderation_note(uuid, text)
  is '@name addCampaignModerationNote';

create or replace function app_public.approve_campaign(campaign_id uuid)
returns app_public.campaign
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_campaign app_public.campaign;
  v_admin_account_id uuid;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can approve campaigns';
  end if;

  v_admin_account_id := app_private.current_account_id();

  if v_admin_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign
  where id = approve_campaign.campaign_id
  for update;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  if v_campaign.moderation_status not in ('pending', 'awaiting_adaptation') then
    raise exception using message = 'Campaign can only be approved from pending or awaiting adaptation status';
  end if;

  update app_public.campaign
  set moderation_status = 'approved'
  where id = v_campaign.id
  returning * into v_campaign;

  perform app_private.create_account_notification(
    v_campaign.creator_account_id,
    'campaign_approved',
    jsonb_build_object(
      'campaignId', v_campaign.id,
      'campaignName', v_campaign.title
    )
  );

  return v_campaign;
end;
$$;

grant execute on function app_public.approve_campaign(uuid)
  to admin;

revoke all on function app_public.approve_campaign(uuid)
  from public;

comment on function app_public.approve_campaign(uuid)
  is '@name approveCampaign';

create or replace function app_public.update_campaign_for_moderation(
  p_campaign_id uuid,
  p_title text,
  p_theme text,
  p_manager_note_from_creator text,
  p_rewards_multiplier integer,
  p_airdrop_amount integer,
  p_start_at timestamptz,
  p_airdrop_at timestamptz,
  p_end_at timestamptz
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
begin
  v_account_id := app_private.current_account_id();

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
    manager_note_from_creator = p_manager_note_from_creator,
    rewards_multiplier = p_rewards_multiplier,
    airdrop_amount = p_airdrop_amount,
    start_at = p_start_at,
    airdrop_at = p_airdrop_at,
    end_at = p_end_at
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
      select ac.account_id
      from app_private.account_credential ac
      where ac.role_name = 'admin'
        and ac.account_id <> v_account_id
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
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz
) to identified_account, admin;

revoke all on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz
) from public;

comment on function app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz
) is '@name updateCampaignForModeration';

create or replace function app_public.campaign_moderation_events(
  p_campaign_id uuid
)
returns table (
  event_type text,
  body text,
  actor_account_id uuid,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_campaign app_public.campaign;
  v_account_id uuid;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_campaign
  from app_public.campaign
  where id = p_campaign_id;

  if v_campaign.id is null then
    raise exception using message = 'Campaign not found';
  end if;

  if not app_private.is_admin() and v_campaign.creator_account_id <> v_account_id then
    raise exception using message = 'Only the campaign creator or administrator can view moderation events';
  end if;

  return query
  select
    e.event_type,
    e.body,
    e.actor_account_id,
    e.created_at
  from (
    select
      'campaign_created'::text as event_type,
      null::text as body,
      c.creator_account_id as actor_account_id,
      c.created_at
    from app_public.campaign c
    where c.id = p_campaign_id

    union all

    select
      'moderation_note_received'::text as event_type,
      n.body,
      n.manager_account_id as actor_account_id,
      n.created_at
    from app_public.campaign_moderation_note n
    where n.campaign_id = p_campaign_id

    union all

    select
      ev.event_type,
      ev.body,
      ev.actor_account_id,
      ev.created_at
    from app_public.campaign_moderation_event ev
    where ev.campaign_id = p_campaign_id
  ) e
  order by e.created_at desc;
end;
$$;

grant execute on function app_public.campaign_moderation_events(uuid)
  to identified_account, admin;

revoke all on function app_public.campaign_moderation_events(uuid)
  from public;

comment on function app_public.campaign_moderation_events(uuid)
  is '@name campaignModerationEvents';

commit;
