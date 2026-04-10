begin;

create table if not exists app_public.campaign_resource (
  campaign_id uuid not null references app_public.campaign(id) on delete cascade,
  resource_id uuid not null references app_public.resource(id) on delete cascade,
  status app_public.campaign_need_status not null default 'pending',
  acted_by_account_id uuid references app_public.account(id),
  acted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (campaign_id, resource_id)
);

create index if not exists campaign_resource_resource_id_idx
  on app_public.campaign_resource (resource_id);

create index if not exists campaign_resource_acted_by_account_id_idx
  on app_public.campaign_resource (acted_by_account_id);

alter table app_public.campaign_resource enable row level security;

drop policy if exists campaign_resource_select_policy on app_public.campaign_resource;
create policy campaign_resource_select_policy on app_public.campaign_resource
  for select
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists campaign_resource_insert_policy on app_public.campaign_resource;
create policy campaign_resource_insert_policy on app_public.campaign_resource
  for insert
  with check (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists campaign_resource_update_policy on app_public.campaign_resource;
create policy campaign_resource_update_policy on app_public.campaign_resource
  for update
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  )
  with check (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.campaign c
      where c.id = campaign_id
        and c.creator_account_id = app_private.current_account_id()
    )
  );

grant select, insert, update on app_public.campaign_resource to identified_account, manager, admin;

comment on table app_public.campaign_resource is 'Approved or pending links between campaigns and resources, used for campaign detail visibility and airdrop eligibility.';

create or replace function app_private.issue_campaign_airdrop_payouts(
  p_now timestamptz default now()
)
returns table (
  campaign_count integer,
  payout_count integer,
  notification_count integer
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_now timestamptz := coalesce(p_now, now());
  v_eligible record;
  v_processed_campaign_ids uuid[] := '{}'::uuid[];
begin
  campaign_count := 0;
  payout_count := 0;
  notification_count := 0;

  for v_eligible in
    with approved_need_counts as (
      select
        cn.campaign_id,
        n.creator_account_id as recipient_account_id,
        count(distinct cn.need_id)::integer as approved_need_count
      from app_public.campaign_need cn
      join app_public.need n on n.id = cn.need_id
      where cn.status = 'accepted'
      group by cn.campaign_id, n.creator_account_id
    ),
    approved_resource_counts as (
      select
        cr.campaign_id,
        r.creator_account_id as recipient_account_id,
        count(distinct cr.resource_id)::integer as approved_resource_count
      from app_public.campaign_resource cr
      join app_public.resource r on r.id = cr.resource_id
      where cr.status = 'accepted'
      group by cr.campaign_id, r.creator_account_id
    ),
    eligible_accounts as (
      select
        coalesce(anc.campaign_id, arc.campaign_id) as campaign_id,
        coalesce(anc.recipient_account_id, arc.recipient_account_id) as recipient_account_id,
        coalesce(anc.approved_need_count, 0) as approved_need_count,
        coalesce(arc.approved_resource_count, 0) as approved_resource_count
      from approved_need_counts anc
      full outer join approved_resource_counts arc
        on arc.campaign_id = anc.campaign_id
       and arc.recipient_account_id = anc.recipient_account_id
    )
    select distinct
      c.id as campaign_id,
      c.title as campaign_title,
      c.airdrop_amount,
      c.creator_account_id as campaign_creator_account_id,
      c.airdrop_at,
      ea.recipient_account_id,
      ea.approved_need_count,
      ea.approved_resource_count,
      ea.approved_need_count + ea.approved_resource_count as eligible_item_count
    from app_public.campaign c
    join eligible_accounts ea
      on ea.campaign_id = c.id
    where c.moderation_status = 'approved'
      and c.airdrop_at <= v_now
      and ea.approved_need_count + ea.approved_resource_count >= 2
      and not exists (
        select 1
        from app_public.token_movement tm
        where tm.idempotency_key = format('campaign:%s:airdrop:%s', c.id, ea.recipient_account_id)
      )
  loop
    if not (v_eligible.campaign_id = any(v_processed_campaign_ids)) then
      v_processed_campaign_ids := array_append(v_processed_campaign_ids, v_eligible.campaign_id);
      campaign_count := campaign_count + 1;
    end if;

    perform app_private.create_token_movement(
      v_eligible.recipient_account_id,
      v_eligible.airdrop_amount,
      'campaign_airdrop_received',
      'campaign',
      v_eligible.campaign_id,
      null,
      jsonb_build_object(
        'campaignId', v_eligible.campaign_id,
        'campaignName', v_eligible.campaign_title,
        'amountReceived', v_eligible.airdrop_amount,
        'airdropAt', v_eligible.airdrop_at,
        'approvedNeedCount', v_eligible.approved_need_count,
        'approvedResourceCount', v_eligible.approved_resource_count,
        'eligibleItemCount', v_eligible.eligible_item_count,
        'rewardType', 'campaign_airdrop'
      ),
      format('campaign:%s:airdrop:%s', v_eligible.campaign_id, v_eligible.recipient_account_id)
    );
    payout_count := payout_count + 1;

    perform app_private.create_account_notification(
      v_eligible.recipient_account_id,
      'campaign_airdrop_done',
      jsonb_build_object(
        'campaignId', v_eligible.campaign_id,
        'campaignName', v_eligible.campaign_title,
        'amountReceived', v_eligible.airdrop_amount,
        'airdropAt', v_eligible.airdrop_at,
        'approvedNeedCount', v_eligible.approved_need_count,
        'approvedResourceCount', v_eligible.approved_resource_count,
        'eligibleItemCount', v_eligible.eligible_item_count,
        'url', '/contribution'
      )
    );
    notification_count := notification_count + 1;
  end loop;

  return next;
end;
$$;

comment on function app_private.issue_campaign_airdrop_payouts(timestamptz)
  is 'Scheduled background issuer for one-time per-account campaign airdrop payouts.';

commit;
