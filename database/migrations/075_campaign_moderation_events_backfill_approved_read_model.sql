-- Backfill approval visibility in the moderation read model for campaigns that
-- were approved before explicit approval events started being persisted.

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

    union all

    select
      'campaign_approved'::text as event_type,
      null::text as body,
      null::uuid as actor_account_id,
      v_campaign.updated_at as created_at
    where v_campaign.moderation_status = 'approved'
      and not exists (
        select 1
        from app_public.campaign_moderation_event ev
        where ev.campaign_id = p_campaign_id
          and ev.event_type = 'campaign_approved'
      )
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
