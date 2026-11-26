drop function if exists app_private.issue_delayed_token_rewards(timestamptz);

create or replace function app_private.issue_delayed_token_rewards(
  p_now timestamptz default now()
)
returns table (
  resource_reward_count integer,
  need_reward_count integer,
  total_reward_count integer
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_effective_at timestamptz;
  v_resource record;
  v_need record;
begin
  resource_reward_count := 0;
  need_reward_count := 0;
  total_reward_count := 0;

  select policy.effective_at into v_effective_at
  from app_private.listing_reward_policy policy where policy.singleton;

  -- Keep the historical payout behavior for listings that predate this policy.
  for v_resource in
    select r.id, r.creator_account_id, r.title
    from app_public.resource r
    where r.created_at <= v_now - interval '24 hours'
      and r.created_at < v_effective_at
      and not exists (
        select 1
        from app_public.token_movement tm
        where tm.idempotency_key = format('resource:%s:age_24h_reward', r.id)
      )
  loop
    perform app_private.create_token_movement(
      v_resource.creator_account_id,
      20,
      'resource_age_24h_reward',
      'resource',
      v_resource.id,
      null,
      jsonb_build_object(
        'resourceId', v_resource.id,
        'resourceTitle', v_resource.title,
        'rewardAmount', 20,
        'rewardType', 'resource_age_24h'
      ),
      format('resource:%s:age_24h_reward', v_resource.id)
    );

    resource_reward_count := resource_reward_count + 1;
  end loop;

  for v_resource in
    select r.id, r.creator_account_id, r.title, r.image_urls, r.default_token_amount, r.created_at
    from app_public.resource r
    where r.created_at >= v_effective_at
      and r.created_at <= v_now - interval '24 hours'
      and r.is_active
      and (r.expires_at is null or r.expires_at > v_now)
      and (
        not exists (select 1 from app_public.token_movement tm
          where tm.idempotency_key = format('resource:%s:age_24h_reward', r.id))
        or (coalesce(array_length(r.image_urls, 1), 0) > 0 and not exists (
          select 1 from app_public.token_movement tm
          where tm.idempotency_key = format('resource:%s:first-image', r.id)))
        or (r.default_token_amount is not null and not exists (
          select 1 from app_public.token_movement tm
          where tm.idempotency_key = format('resource:%s:first-default-token-amount', r.id)))
      )
    for update of r skip locked
  loop
    if app_private.issue_listing_token_reward(
      'resource', v_resource.id, 'age_24h', 20,
      v_resource.created_at + interval '24 hours',
      jsonb_build_object('resourceId', v_resource.id, 'resourceTitle', v_resource.title), v_now
    ) > 0 then
      resource_reward_count := resource_reward_count + 1;
    end if;
    if coalesce(array_length(v_resource.image_urls, 1), 0) > 0 then
      perform app_private.issue_listing_token_reward(
        'resource', v_resource.id, 'first_image', 20,
        v_resource.created_at + interval '24 hours',
        jsonb_build_object('resourceId', v_resource.id, 'resourceName', v_resource.title), v_now
      );
    end if;
    if v_resource.default_token_amount is not null then
      perform app_private.issue_listing_token_reward(
        'resource', v_resource.id, 'first_default_token_amount', 20,
        v_resource.created_at + interval '24 hours',
        jsonb_build_object('resourceId', v_resource.id, 'resourceName', v_resource.title,
          'defaultTokenAmount', v_resource.default_token_amount), v_now
      );
    end if;
  end loop;

  -- Preserve the previous need behavior for listings created before cutover.
  for v_need in
    select n.id, n.creator_account_id
    from app_public.need n
    where n.created_at <= v_now - interval '24 hours'
      and n.created_at < v_effective_at
      and n.is_active = true
      and not exists (
        select 1
        from app_public.token_movement tm
        where tm.idempotency_key = format('need:%s:age_24h_reward', n.id)
      )
  loop
    perform app_private.create_token_movement(
      v_need.creator_account_id,
      10,
      'need_age_24h_reward',
      'need',
      v_need.id,
      null,
      jsonb_build_object(
        'needId', v_need.id,
        'rewardAmount', 10,
        'rewardType', 'need_age_24h'
      ),
      format('need:%s:age_24h_reward', v_need.id)
    );

    need_reward_count := need_reward_count + 1;
  end loop;

  for v_need in
    select n.id, n.creator_account_id, n.title, n.image_urls, n.proposed_topes_amount, n.created_at
    from app_public.need n
    where n.created_at >= v_effective_at
      and n.created_at <= v_now - interval '24 hours'
      and n.is_active
      and (n.expires_at is null or n.expires_at > v_now)
      and (
        not exists (select 1 from app_public.token_movement tm
          where tm.idempotency_key = format('need:%s:age_24h_reward', n.id))
        or (coalesce(array_length(n.image_urls, 1), 0) > 0 and not exists (
          select 1 from app_public.token_movement tm
          where tm.idempotency_key = format('need:%s:first-image', n.id)))
        or (n.proposed_topes_amount is not null and not exists (
          select 1 from app_public.token_movement tm
          where tm.idempotency_key = format('need:%s:first-default-token-amount', n.id)))
      )
    for update of n skip locked
  loop
    if app_private.issue_listing_token_reward(
      'need', v_need.id, 'age_24h', 10,
      v_need.created_at + interval '24 hours',
      jsonb_build_object('needId', v_need.id, 'rewardAmount', 10), v_now
    ) > 0 then
      need_reward_count := need_reward_count + 1;
    end if;
    if coalesce(array_length(v_need.image_urls, 1), 0) > 0 then
      perform app_private.issue_listing_token_reward(
        'need', v_need.id, 'first_image', 10,
        v_need.created_at + interval '24 hours',
        jsonb_build_object('needId', v_need.id, 'needTitle', v_need.title), v_now
      );
    end if;
    if v_need.proposed_topes_amount is not null then
      perform app_private.issue_listing_token_reward(
        'need', v_need.id, 'first_default_token_amount', 10,
        v_need.created_at + interval '24 hours',
        jsonb_build_object('needId', v_need.id, 'needTitle', v_need.title,
          'proposedTopesAmount', v_need.proposed_topes_amount), v_now
      );
    end if;
  end loop;

  total_reward_count := resource_reward_count + need_reward_count;
  return next;
end;
$$;

comment on function app_private.issue_delayed_token_rewards(timestamptz)
  is 'Scheduled background issuer for one-time 24h resource and need token rewards.';
