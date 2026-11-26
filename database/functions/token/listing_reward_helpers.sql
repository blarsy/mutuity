create table if not exists app_private.listing_reward_policy (
  singleton boolean primary key default true check (singleton),
  effective_at timestamptz not null default clock_timestamp()
);

insert into app_private.listing_reward_policy (singleton)
values (true)
on conflict (singleton) do nothing;

comment on table app_private.listing_reward_policy is
  'Cutover timestamp for prospective-only resource and need reward timing/multiplier rules.';

create or replace function app_private.listing_campaign_reward_multiplier(
  p_listing_kind text,
  p_listing_id uuid,
  p_reward_due_at timestamptz,
  p_now timestamptz default clock_timestamp()
)
returns integer
language plpgsql
stable
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_multiplier integer;
begin
  if p_listing_kind = 'resource' then
    select c.rewards_multiplier
    into v_multiplier
    from app_public.campaign_resource cr
    join app_public.campaign c on c.id = cr.campaign_id
    join app_public.resource r on r.id = cr.resource_id
    where cr.resource_id = p_listing_id
      and cr.status = 'accepted'
      and cr.acted_at <= p_now
      and c.moderation_status = 'approved'
      and r.created_at >= c.start_at
      and r.created_at < c.end_at
      and cr.acted_at >= c.start_at
      and cr.acted_at < c.end_at
      and p_reward_due_at >= c.start_at
      and p_reward_due_at < c.end_at
    order by
      case when cr.acted_at <= p_reward_due_at then 0 else 1 end,
      case when cr.acted_at <= p_reward_due_at then cr.acted_at end desc,
      cr.acted_at asc
    limit 1;
  elsif p_listing_kind = 'need' then
    select c.rewards_multiplier
    into v_multiplier
    from app_public.campaign_need cn
    join app_public.campaign c on c.id = cn.campaign_id
    join app_public.need n on n.id = cn.need_id
    where cn.need_id = p_listing_id
      and cn.status = 'accepted'
      and cn.acted_at <= p_now
      and c.moderation_status = 'approved'
      and n.created_at >= c.start_at
      and n.created_at < c.end_at
      and cn.acted_at >= c.start_at
      and cn.acted_at < c.end_at
      and p_reward_due_at >= c.start_at
      and p_reward_due_at < c.end_at
    order by
      case when cn.acted_at <= p_reward_due_at then 0 else 1 end,
      case when cn.acted_at <= p_reward_due_at then cn.acted_at end desc,
      cn.acted_at asc
    limit 1;
  else
    raise exception 'Invalid listing kind';
  end if;

  return coalesce(v_multiplier, 1);
end;
$$;

create or replace function app_private.issue_listing_token_reward(
  p_listing_kind text,
  p_listing_id uuid,
  p_reward_code text,
  p_base_amount integer,
  p_reward_due_at timestamptz,
  p_payload jsonb default '{}'::jsonb,
  p_now timestamptz default clock_timestamp()
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid;
  v_created_at timestamptz;
  v_is_active boolean;
  v_expires_at timestamptz;
  v_title text;
  v_effective_at timestamptz;
  v_multiplier integer;
  v_amount integer;
  v_event_type text;
  v_idempotency_key text;
  v_existing boolean;
  v_reward_type text;
begin
  if p_listing_kind = 'resource' then
    select r.creator_account_id, r.created_at, r.is_active, r.expires_at, r.title
    into v_account_id, v_created_at, v_is_active, v_expires_at, v_title
    from app_public.resource r
    where r.id = p_listing_id;
    v_event_type := case p_reward_code
      when 'age_24h' then 'resource_age_24h_reward'
      when 'first_image' then 'resource_first_image_reward'
      when 'first_default_token_amount' then 'resource_first_default_token_amount_reward'
      else null end;
    v_idempotency_key := format('resource:%s:%s', p_listing_id, case p_reward_code
      when 'age_24h' then 'age_24h_reward'
      when 'first_image' then 'first-image'
      when 'first_default_token_amount' then 'first-default-token-amount'
      else p_reward_code end);
    v_reward_type := case p_reward_code
      when 'age_24h' then 'resource_age_24h'
      when 'first_image' then 'resource_image_milestone'
      when 'first_default_token_amount' then 'resource_default_token_amount_milestone'
      else p_reward_code end;
  elsif p_listing_kind = 'need' then
    select n.creator_account_id, n.created_at, n.is_active, n.expires_at, n.title
    into v_account_id, v_created_at, v_is_active, v_expires_at, v_title
    from app_public.need n
    where n.id = p_listing_id;
    v_event_type := case p_reward_code
      when 'age_24h' then 'need_age_24h_reward'
      when 'first_image' then 'need_first_image_reward'
      when 'first_default_token_amount' then 'need_first_default_token_amount_reward'
      else null end;
    v_idempotency_key := format('need:%s:%s', p_listing_id, case p_reward_code
      when 'age_24h' then 'age_24h_reward'
      when 'first_image' then 'first-image'
      when 'first_default_token_amount' then 'first-default-token-amount'
      else p_reward_code end);
    v_reward_type := case p_reward_code
      when 'age_24h' then 'need_age_24h'
      when 'first_image' then 'need_image_milestone'
      when 'first_default_token_amount' then 'need_default_token_amount_milestone'
      else p_reward_code end;
  else
    raise exception 'Invalid listing kind';
  end if;

  if v_account_id is null or v_event_type is null or p_base_amount <= 0 or p_reward_due_at is null then
    return 0;
  end if;

  select policy.effective_at into v_effective_at
  from app_private.listing_reward_policy policy
  where policy.singleton;

  if v_created_at < v_effective_at
    or v_created_at + interval '24 hours' > p_now
    or p_reward_due_at > p_now
    or not v_is_active
    or (v_expires_at is not null and v_expires_at <= p_now) then
    return 0;
  end if;

  select exists (
    select 1 from app_public.token_movement tm
    where tm.idempotency_key = v_idempotency_key
  ) into v_existing;
  if v_existing then
    return 0;
  end if;

  v_multiplier := app_private.listing_campaign_reward_multiplier(
    p_listing_kind, p_listing_id, p_reward_due_at, p_now
  );
  v_amount := p_base_amount * v_multiplier;

  perform app_private.create_token_movement(
    v_account_id,
    v_amount,
    v_event_type,
    p_listing_kind,
    p_listing_id,
    null,
    coalesce(p_payload, '{}'::jsonb) || jsonb_build_object(
      'rewardAmount', v_amount,
      'standardRewardAmount', p_base_amount,
      'campaignMultiplier', v_multiplier,
      'rewardDueAt', p_reward_due_at,
      'rewardType', v_reward_type
    ),
    v_idempotency_key
  );

  return v_amount;
end;
$$;

create or replace function app_private.apply_campaign_multiplier_to_listing_rewards(
  p_listing_kind text,
  p_listing_id uuid,
  p_campaign_id uuid,
  p_now timestamptz default clock_timestamp()
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid;
  v_created_at timestamptz;
  v_is_active boolean;
  v_expires_at timestamptz;
  v_campaign app_public.campaign;
  v_multiplier integer;
  v_effective_at timestamptz;
  v_movement record;
  v_base_amount integer;
  v_reward_due_at timestamptz;
  v_target_amount integer;
  v_existing_total integer;
  v_delta integer;
  v_count integer := 0;
  v_kind_prefix text;
begin
  if p_listing_kind = 'resource' then
    select r.creator_account_id, r.created_at, r.is_active, r.expires_at
    into v_account_id, v_created_at, v_is_active, v_expires_at
    from app_public.resource r where r.id = p_listing_id;
    v_kind_prefix := 'resource';
  elsif p_listing_kind = 'need' then
    select n.creator_account_id, n.created_at, n.is_active, n.expires_at
    into v_account_id, v_created_at, v_is_active, v_expires_at
    from app_public.need n where n.id = p_listing_id;
    v_kind_prefix := 'need';
  else
    raise exception 'Invalid listing kind';
  end if;

  select policy.effective_at into v_effective_at
  from app_private.listing_reward_policy policy where policy.singleton;
  if v_account_id is null or v_created_at < v_effective_at or not v_is_active
    or (v_expires_at is not null and v_expires_at <= p_now) then
    return 0;
  end if;

  select * into v_campaign from app_public.campaign c
  where c.id = p_campaign_id and c.moderation_status = 'approved';
  if not found or v_created_at < v_campaign.start_at or v_created_at >= v_campaign.end_at
    or v_campaign.rewards_multiplier <= 1 then
    return 0;
  end if;

  if p_listing_kind = 'resource' then
    if not exists (
      select 1 from app_public.campaign_resource cr
      where cr.campaign_id = p_campaign_id and cr.resource_id = p_listing_id
        and cr.status = 'accepted' and cr.is_current
        and cr.acted_at >= v_campaign.start_at and cr.acted_at < v_campaign.end_at
        and cr.acted_at <= p_now
    ) then return 0; end if;
  else
    if not exists (
      select 1 from app_public.campaign_need cn
      where cn.campaign_id = p_campaign_id and cn.need_id = p_listing_id
        and cn.status = 'accepted' and cn.is_current
        and cn.acted_at >= v_campaign.start_at and cn.acted_at < v_campaign.end_at
        and cn.acted_at <= p_now
    ) then return 0; end if;
  end if;

  v_multiplier := v_campaign.rewards_multiplier;
  for v_movement in
    select tm.*
    from app_public.token_movement tm
    where tm.account_id = v_account_id
      and tm.reference_type = p_listing_kind
      and tm.reference_id = p_listing_id
      and tm.event_type in (
        v_kind_prefix || '_age_24h_reward',
        v_kind_prefix || '_first_image_reward',
        v_kind_prefix || '_first_default_token_amount_reward'
      )
  loop
    v_base_amount := case when p_listing_kind = 'resource' then 20 else 10 end;
    v_reward_due_at := coalesce(
      nullif(v_movement.payload ->> 'rewardDueAt', '')::timestamptz,
      v_movement.created_at
    );
    if v_reward_due_at > p_now
      or v_reward_due_at < v_campaign.start_at
      or v_reward_due_at >= v_campaign.end_at then
      continue;
    end if;

    v_target_amount := v_base_amount * v_multiplier;
    select v_movement.amount_delta + coalesce(sum(adjustment.amount_delta), 0)::integer
    into v_existing_total
    from app_public.token_movement adjustment
    where adjustment.account_id = v_account_id
      and adjustment.reference_type = p_listing_kind
      and adjustment.reference_id = p_listing_id
      and adjustment.event_type = v_kind_prefix || '_campaign_multiplier_adjustment'
      and adjustment.payload ->> 'rewardEventType' = v_movement.event_type;
    v_delta := v_target_amount - v_existing_total;
    if v_delta <= 0 then
      continue;
    end if;

    perform app_private.create_token_movement(
      v_account_id,
      v_delta,
      v_kind_prefix || '_campaign_multiplier_adjustment',
      p_listing_kind,
      p_listing_id,
      null,
      jsonb_build_object(
        'campaignId', p_campaign_id,
        'campaignMultiplier', v_multiplier,
        'rewardEventType', v_movement.event_type,
        'standardRewardAmount', v_base_amount,
        'previousRewardAmount', v_existing_total,
        'rewardAmount', v_target_amount,
        'rewardDueAt', v_reward_due_at,
        'rewardType', 'campaign_multiplier_adjustment'
      ),
      format('%s:%s:campaign:%s:multiplier:%s', p_listing_kind, p_listing_id, p_campaign_id, v_movement.event_type)
    );
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function app_private.apply_campaign_multiplier_after_listing_acceptance()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_listing_kind text := case when tg_table_name = 'campaign_resource' then 'resource' else 'need' end;
  v_listing_id uuid;
begin
  if old.status = 'accepted' or new.status <> 'accepted' or not new.is_current then
    return new;
  end if;

  if v_listing_kind = 'resource' then
    v_listing_id := new.resource_id;
  else
    v_listing_id := new.need_id;
  end if;

  perform app_private.apply_campaign_multiplier_to_listing_rewards(
    v_listing_kind, v_listing_id, new.campaign_id, clock_timestamp()
  );
  return new;
end;
$$;

revoke all on function app_private.listing_campaign_reward_multiplier(text, uuid, timestamptz, timestamptz),
  app_private.issue_listing_token_reward(text, uuid, text, integer, timestamptz, jsonb, timestamptz),
  app_private.apply_campaign_multiplier_to_listing_rewards(text, uuid, uuid, timestamptz),
  app_private.apply_campaign_multiplier_after_listing_acceptance()
  from public, anonymous, identified_account, admin;

drop trigger if exists trg_campaign_resource_reward_multiplier on app_public.campaign_resource;
create trigger trg_campaign_resource_reward_multiplier
  after update of status on app_public.campaign_resource
  for each row when (old.status is distinct from new.status and new.status = 'accepted')
  execute function app_private.apply_campaign_multiplier_after_listing_acceptance();

drop trigger if exists trg_campaign_need_reward_multiplier on app_public.campaign_need;
create trigger trg_campaign_need_reward_multiplier
  after update of status on app_public.campaign_need
  for each row when (old.status is distinct from new.status and new.status = 'accepted')
  execute function app_private.apply_campaign_multiplier_after_listing_acceptance();
