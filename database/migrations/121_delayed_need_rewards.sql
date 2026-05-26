begin;

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
  v_resource record;
  v_need record;
begin
  resource_reward_count := 0;
  need_reward_count := 0;
  total_reward_count := 0;

  for v_resource in
    select r.id, r.creator_account_id, r.title
    from app_public.resource r
    where r.created_at <= v_now - interval '24 hours'
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

  for v_need in
    select n.id, n.creator_account_id
    from app_public.need n
    where n.created_at <= v_now - interval '24 hours'
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

  total_reward_count := resource_reward_count + need_reward_count;
  return next;
end;
$$;

comment on function app_private.issue_delayed_token_rewards(timestamptz)
  is 'Scheduled background issuer for one-time 24h resource and need token rewards.';

commit;
