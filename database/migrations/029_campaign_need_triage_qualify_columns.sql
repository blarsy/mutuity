begin;

create or replace function app_public.accept_campaign_need(campaign_id uuid, need_id uuid)
returns app_public.campaign_need
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_campaign_creator_account_id uuid;
  v_campaign_need_status app_public.campaign_need_status;
  v_campaign_need app_public.campaign_need;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select
    cn.status,
    c.creator_account_id
  into
    v_campaign_need_status,
    v_campaign_creator_account_id
  from app_public.campaign_need cn
  join app_public.campaign c on c.id = cn.campaign_id
  where cn.campaign_id = accept_campaign_need.campaign_id
    and cn.need_id = accept_campaign_need.need_id
  for update of cn;

  if not found then
    raise exception using message = 'Campaign need relation not found';
  end if;

  if v_campaign_creator_account_id <> v_account_id then
    raise exception using message = 'Only the campaign creator can triage joined needs';
  end if;

  if v_campaign_need_status <> 'pending' then
    raise exception using message = 'Campaign need can only be triaged from pending status';
  end if;

  update app_public.campaign_need
  set status = 'accepted',
      acted_by_account_id = v_account_id,
      acted_at = now()
  where app_public.campaign_need.campaign_id = accept_campaign_need.campaign_id
    and app_public.campaign_need.need_id = accept_campaign_need.need_id
  returning * into v_campaign_need;

  return v_campaign_need;
end;
$$;

create or replace function app_public.reject_campaign_need(campaign_id uuid, need_id uuid)
returns app_public.campaign_need
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_campaign_creator_account_id uuid;
  v_campaign_need_status app_public.campaign_need_status;
  v_campaign_need app_public.campaign_need;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select
    cn.status,
    c.creator_account_id
  into
    v_campaign_need_status,
    v_campaign_creator_account_id
  from app_public.campaign_need cn
  join app_public.campaign c on c.id = cn.campaign_id
  where cn.campaign_id = reject_campaign_need.campaign_id
    and cn.need_id = reject_campaign_need.need_id
  for update of cn;

  if not found then
    raise exception using message = 'Campaign need relation not found';
  end if;

  if v_campaign_creator_account_id <> v_account_id then
    raise exception using message = 'Only the campaign creator can triage joined needs';
  end if;

  if v_campaign_need_status <> 'pending' then
    raise exception using message = 'Campaign need can only be triaged from pending status';
  end if;

  update app_public.campaign_need
  set status = 'rejected',
      acted_by_account_id = v_account_id,
      acted_at = now()
  where app_public.campaign_need.campaign_id = reject_campaign_need.campaign_id
    and app_public.campaign_need.need_id = reject_campaign_need.need_id
  returning * into v_campaign_need;

  return v_campaign_need;
end;
$$;

grant execute on function app_public.accept_campaign_need(uuid, uuid) to identified_account, manager, admin;
grant execute on function app_public.reject_campaign_need(uuid, uuid) to identified_account, manager, admin;

comment on function app_public.accept_campaign_need(uuid, uuid)
  is '@name acceptCampaignNeed';

comment on function app_public.reject_campaign_need(uuid, uuid)
  is '@name rejectCampaignNeed';

commit;
