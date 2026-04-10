begin;

create or replace function app_private.issue_campaign_airdrop_coming_soon(
  p_now timestamptz default now()
)
returns table (
  campaign_count integer,
  recipient_count integer,
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
  recipient_count := 0;
  notification_count := 0;

  for v_eligible in
    with linked_need_counts as (
      select
        cn.campaign_id,
        n.creator_account_id as recipient_account_id,
        count(distinct cn.need_id)::integer as linked_need_count
      from app_public.campaign_need cn
      join app_public.need n on n.id = cn.need_id
      group by cn.campaign_id, n.creator_account_id
    ),
    linked_resource_counts as (
      select
        cr.campaign_id,
        r.creator_account_id as recipient_account_id,
        count(distinct cr.resource_id)::integer as linked_resource_count
      from app_public.campaign_resource cr
      join app_public.resource r on r.id = cr.resource_id
      group by cr.campaign_id, r.creator_account_id
    ),
    linked_accounts as (
      select
        coalesce(lnc.campaign_id, lrc.campaign_id) as campaign_id,
        coalesce(lnc.recipient_account_id, lrc.recipient_account_id) as recipient_account_id,
        coalesce(lnc.linked_need_count, 0) as linked_need_count,
        coalesce(lrc.linked_resource_count, 0) as linked_resource_count
      from linked_need_counts lnc
      full outer join linked_resource_counts lrc
        on lrc.campaign_id = lnc.campaign_id
       and lrc.recipient_account_id = lnc.recipient_account_id
    )
    select distinct
      c.id as campaign_id,
      c.title as campaign_title,
      c.airdrop_at,
      la.recipient_account_id,
      la.linked_need_count,
      la.linked_resource_count,
      la.linked_need_count + la.linked_resource_count as linked_item_count
    from app_public.campaign c
    join linked_accounts la
      on la.campaign_id = c.id
    where c.moderation_status = 'approved'
      and c.airdrop_at > v_now
      and c.airdrop_at <= v_now + interval '48 hours'
      and la.linked_need_count + la.linked_resource_count >= 1
      and not exists (
        select 1
        from app_public.account_notification an
        where an.recipient_account_id = la.recipient_account_id
          and an.event_type = 'campaign_airdrop_coming_soon'
          and an.payload ->> 'campaignId' = c.id::text
      )
  loop
    if not (v_eligible.campaign_id = any(v_processed_campaign_ids)) then
      v_processed_campaign_ids := array_append(v_processed_campaign_ids, v_eligible.campaign_id);
      campaign_count := campaign_count + 1;
    end if;

    perform app_private.create_account_notification(
      v_eligible.recipient_account_id,
      'campaign_airdrop_coming_soon',
      jsonb_build_object(
        'campaignId', v_eligible.campaign_id,
        'campaignName', v_eligible.campaign_title,
        'airdropAt', v_eligible.airdrop_at,
        'linkedNeedCount', v_eligible.linked_need_count,
        'linkedResourceCount', v_eligible.linked_resource_count,
        'linkedItemCount', v_eligible.linked_item_count
      )
    );
    recipient_count := recipient_count + 1;
    notification_count := notification_count + 1;
  end loop;

  return next;
end;
$$;

comment on function app_private.issue_campaign_airdrop_coming_soon(timestamptz)
  is 'Scheduled background issuer for one-time campaign airdrop coming-soon notifications.';

commit;
