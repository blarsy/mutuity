begin;

-- Canonical campaign listing state machine. All callers lock the listing first.
create or replace function app_private.submit_campaign_listing(p_kind text, p_campaign_id uuid, p_listing_id uuid)
returns jsonb
language plpgsql
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account uuid := app_private.current_account_id();
  v_owner uuid;
  v_active boolean;
  v_expires_at timestamptz;
  v_campaign app_public.campaign;
  v_current jsonb;
  v_result jsonb;
  v_table text;
  v_column text;
  v_now timestamptz;
begin
  if v_account is null then raise exception 'Authentication required'; end if;
  if p_kind not in ('need', 'resource') then raise exception 'Invalid listing kind'; end if;
  v_table := 'campaign_' || p_kind;
  v_column := p_kind || '_id';
  execute format('select creator_account_id, is_active, expires_at from app_public.%I where id=$1 for update', p_kind)
    into v_owner,v_active,v_expires_at using p_listing_id;
  if v_owner is distinct from v_account then
    raise exception 'Only the % creator can join a campaign', p_kind;
  end if;
  -- Read wall time AFTER acquiring the lock: blocked transactions must not use
  -- a stale transaction timestamp at either the 24-hour or campaign-end boundary.
  v_now := clock_timestamp();
  select * into v_campaign from app_public.campaign where id=p_campaign_id for share;
  if not found or v_campaign.moderation_status <> 'approved'
    or v_campaign.start_at > v_now or v_campaign.end_at <= v_now then
    raise exception 'Campaign is not currently linkable';
  end if;
  -- Ended relationships retain their accepted status for historical payouts.
  execute format('update app_public.%I l set is_current=false from app_public.campaign c
    where l.campaign_id=c.id and l.%I=$1 and l.is_current and c.end_at <= $2', v_table, v_column)
    using p_listing_id, v_now;
  execute format('select to_jsonb(l) from app_public.%I l where l.%I=$1 and l.is_current', v_table, v_column)
    into v_current using p_listing_id;
  if v_current is not null then
    if (v_current->>'campaign_id')::uuid=p_campaign_id then
      -- Idempotent retries must never reset a decision or its protection period.
      execute format('select to_jsonb(l) from app_public.%I l where l.campaign_id=$1 and l.%I=$2', v_table, v_column)
        into v_result using p_campaign_id,p_listing_id;
      return v_result;
    end if;
    if v_current->>'status'='accepted' then raise exception 'Listing is accepted until the campaign ends'; end if;
    if (v_current->>'submitted_at')::timestamptz + interval '24 hours' > v_now then
      raise exception 'Pending application cannot be replaced for 24 hours';
    end if;
  end if;
  if not v_active or v_expires_at <= v_now then
    raise exception '% is no longer active', initcap(p_kind);
  end if;
  if v_current is not null then
    execute format('update app_public.%I set status=''superseded'',is_current=false where %I=$1 and is_current', v_table,v_column)
      using p_listing_id;
  end if;
  execute format('insert into app_public.%I as l (campaign_id,%I,status,submission_id,submitted_at,is_current)
    values($1,$2,''pending'',gen_random_uuid(),$3,true)
    on conflict(campaign_id,%I) do update set status=''pending'',submission_id=gen_random_uuid(),
      submitted_at=$3,is_current=true,rejection_note=null,acted_at=null,acted_by_account_id=null
    returning to_jsonb(l)',v_table,v_column,v_column)
    into v_result using p_campaign_id,p_listing_id,v_now;
  return v_result;
end;
$$;
revoke all on function app_private.submit_campaign_listing(text,uuid,uuid) from public,anonymous,identified_account,admin;

create or replace function app_private.decide_campaign_listing(
  p_kind text,p_campaign_id uuid,p_listing_id uuid,p_expected_submission_id uuid,p_accept boolean,p_rejection_note text default null
)
returns jsonb
language plpgsql
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account uuid := app_private.current_account_id();
  v_owner uuid;
  v_campaign app_public.campaign;
  v_link jsonb;
  v_result jsonb;
  v_table text;
  v_column text;
  v_now timestamptz;
begin
  if v_account is null then raise exception 'Authentication required'; end if;
  if p_kind not in ('need','resource') then raise exception 'Invalid listing kind'; end if;
  v_table := 'campaign_' || p_kind;
  v_column := p_kind || '_id';
  execute format('select creator_account_id from app_public.%I where id=$1 for update',p_kind) into v_owner using p_listing_id;
  v_now := clock_timestamp();
  select * into v_campaign from app_public.campaign where id=p_campaign_id for share;
  if v_campaign.creator_account_id is distinct from v_account then
    raise exception 'Only the campaign creator can triage joined listings';
  end if;
  if v_campaign.moderation_status <> 'approved' or v_campaign.start_at > v_now or v_campaign.end_at <= v_now then
    raise exception 'Campaign is not currently linkable';
  end if;
  execute format('select to_jsonb(l) from app_public.%I l where campaign_id=$1 and %I=$2',v_table,v_column)
    into v_link using p_campaign_id,p_listing_id;
  if v_link is null or p_expected_submission_id is null
    or (v_link->>'submission_id')::uuid <> p_expected_submission_id
    or not (v_link->>'is_current')::boolean or v_link->>'status' <> 'pending' then
    raise exception 'This application is no longer available for review';
  end if;
  if length(btrim(p_rejection_note)) > 2000 then raise exception 'Rejection note must not exceed 2000 characters'; end if;
  execute format('update app_public.%I as l set status=$3::app_public.campaign_need_status,
      acted_by_account_id=$4,acted_at=$5,is_current=$6,rejection_note=$7
    where campaign_id=$1 and %I=$2 returning to_jsonb(l)',v_table,v_column)
    into v_result using p_campaign_id,p_listing_id,case when p_accept then 'accepted' else 'rejected' end,
      v_account,v_now,p_accept,case when p_accept then null else nullif(btrim(p_rejection_note),'') end;
  return v_result;
end;
$$;
revoke all on function app_private.decide_campaign_listing(text,uuid,uuid,uuid,boolean,text) from public,anonymous,identified_account,admin;

create or replace function app_public.link_campaign_need(p_campaign_id uuid,p_need_id uuid)
returns app_public.campaign_need language sql security definer
set search_path = pg_catalog, app_public, app_private as $$
  select * from jsonb_populate_record(null::app_public.campaign_need,app_private.submit_campaign_listing('need',p_campaign_id,p_need_id))
$$;
create or replace function app_public.link_campaign_resource(p_campaign_id uuid,p_resource_id uuid)
returns app_public.campaign_resource language sql security definer
set search_path = pg_catalog, app_public, app_private as $$
  select * from jsonb_populate_record(null::app_public.campaign_resource,app_private.submit_campaign_listing('resource',p_campaign_id,p_resource_id))
$$;
create or replace function app_public.accept_campaign_need(campaign_id uuid,need_id uuid,expected_submission_id uuid)
returns app_public.campaign_need language sql security definer
set search_path = pg_catalog, app_public, app_private as $$
  select * from jsonb_populate_record(null::app_public.campaign_need,app_private.decide_campaign_listing('need',campaign_id,need_id,expected_submission_id,true))
$$;
create or replace function app_public.reject_campaign_need(campaign_id uuid,need_id uuid,expected_submission_id uuid,rejection_note text default null)
returns app_public.campaign_need language sql security definer
set search_path = pg_catalog, app_public, app_private as $$
  select * from jsonb_populate_record(null::app_public.campaign_need,app_private.decide_campaign_listing('need',campaign_id,need_id,expected_submission_id,false,rejection_note))
$$;
create or replace function app_public.accept_campaign_resource(campaign_id uuid,resource_id uuid,expected_submission_id uuid)
returns app_public.campaign_resource language sql security definer
set search_path = pg_catalog, app_public, app_private as $$
  select * from jsonb_populate_record(null::app_public.campaign_resource,app_private.decide_campaign_listing('resource',campaign_id,resource_id,expected_submission_id,true))
$$;
create or replace function app_public.reject_campaign_resource(campaign_id uuid,resource_id uuid,expected_submission_id uuid,rejection_note text default null)
returns app_public.campaign_resource language sql security definer
set search_path = pg_catalog, app_public, app_private as $$
  select * from jsonb_populate_record(null::app_public.campaign_resource,app_private.decide_campaign_listing('resource',campaign_id,resource_id,expected_submission_id,false,rejection_note))
$$;

revoke all on function app_public.link_campaign_need(uuid,uuid),app_public.link_campaign_resource(uuid,uuid),
  app_public.accept_campaign_need(uuid,uuid,uuid),app_public.reject_campaign_need(uuid,uuid,uuid,text),
  app_public.accept_campaign_resource(uuid,uuid,uuid),app_public.reject_campaign_resource(uuid,uuid,uuid,text) from public;
grant execute on function app_public.link_campaign_need(uuid,uuid),app_public.link_campaign_resource(uuid,uuid),
  app_public.accept_campaign_need(uuid,uuid,uuid),app_public.reject_campaign_need(uuid,uuid,uuid,text),
  app_public.accept_campaign_resource(uuid,uuid,uuid),app_public.reject_campaign_resource(uuid,uuid,uuid,text) to identified_account,admin;
comment on function app_public.link_campaign_need(uuid,uuid) is '@name linkCampaignNeed';
comment on function app_public.link_campaign_resource(uuid,uuid) is '@name linkCampaignResource';
comment on function app_public.accept_campaign_need(uuid,uuid,uuid) is '@name acceptCampaignNeed';
comment on function app_public.reject_campaign_need(uuid,uuid,uuid,text) is '@name rejectCampaignNeed';
comment on function app_public.accept_campaign_resource(uuid,uuid,uuid) is '@name acceptCampaignResource';
comment on function app_public.reject_campaign_resource(uuid,uuid,uuid,text) is '@name rejectCampaignResource';

create or replace function app_private.record_campaign_listing_submission()
returns trigger language plpgsql security definer
set search_path = pg_catalog, app_public, app_private as $$
declare
  v_row jsonb := to_jsonb(new);
  v_kind text := case when tg_table_name='campaign_need' then 'need' else 'resource' end;
  v_owner uuid;
  v_campaign app_public.campaign;
  v_title text;
begin
  if tg_op='UPDATE' and new.submission_id=old.submission_id and new.status=old.status then return new; end if;
  insert into app_public.campaign_listing_submission_event(campaign_id,need_id,resource_id,submission_id,status,
      rejection_note,submitted_at,acted_at,actor_account_id)
  values(new.campaign_id,(v_row->>'need_id')::uuid,(v_row->>'resource_id')::uuid,new.submission_id,new.status,
      new.rejection_note,new.submitted_at,new.acted_at,app_private.current_account_id());
  execute format('select creator_account_id,title from app_public.%I where id=$1',v_kind)
    into v_owner,v_title using (v_row->>(v_kind || '_id'))::uuid;
  select * into v_campaign from app_public.campaign where id=new.campaign_id;
  if new.status in ('pending','accepted','rejected') then
    perform app_private.create_account_notification(
      case when new.status='pending' then v_campaign.creator_account_id else v_owner end,
      'campaign_listing_' || new.status::text,
      jsonb_build_object('campaignId',new.campaign_id,'campaignName',v_campaign.title,
        'listingKind',v_kind,'listingId',v_row->>(v_kind || '_id'),'listingName',v_title,
        'submissionId',new.submission_id,'rejectionNote',new.rejection_note,
        'url',case when new.status='pending' then '/campaigns/' || new.campaign_id || '/moderation'
          else '/' || v_kind || 's/' || (v_row->>(v_kind || '_id')) || '/edit' end)
    );
  end if;
  return new;
end;
$$;
revoke all on function app_private.record_campaign_listing_submission() from public,anonymous,identified_account,admin;

commit;