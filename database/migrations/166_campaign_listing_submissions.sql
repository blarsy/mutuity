begin;

alter table app_public.campaign_need
  add column submission_id uuid not null default gen_random_uuid(),
  add column submitted_at timestamptz not null default now(),
  add column rejection_note text check(length(rejection_note)<=2000),
  add column is_current boolean not null default false;
alter table app_public.campaign_resource
  add column submission_id uuid not null default gen_random_uuid(),
  add column submitted_at timestamptz not null default now(),
  add column rejection_note text check(length(rejection_note)<=2000),
  add column is_current boolean not null default false;

-- Development data has no historical guarantees. Normalize conflicting slots
-- deterministically, preserving at most one accepted (otherwise newest pending).
do $$
declare v_kind text;
begin
  foreach v_kind in array array['need','resource'] loop
    execute format('update app_public.campaign_%I set submitted_at=created_at',v_kind);
    execute format('with ranked as (
      select l.campaign_id,l.%1$I_id,row_number() over(partition by l.%1$I_id
        order by (l.status=''accepted'') desc,l.created_at desc,l.campaign_id) as rank
      from app_public.campaign_%1$I l join app_public.campaign c on c.id=l.campaign_id
      where l.status in (''pending'',''accepted'') and c.end_at>now()
    ) update app_public.campaign_%1$I l set is_current=(r.rank=1),
      status=case when r.rank=1 then l.status else ''superseded''::app_public.campaign_need_status end
      from ranked r where l.campaign_id=r.campaign_id and l.%1$I_id=r.%1$I_id',v_kind);
  end loop;
end $$;

create unique index campaign_need_current_slot on app_public.campaign_need(need_id) where is_current;
create unique index campaign_resource_current_slot on app_public.campaign_resource(resource_id) where is_current;
create index campaign_need_submitted_at_idx on app_public.campaign_need(submitted_at);
create index campaign_resource_submitted_at_idx on app_public.campaign_resource(submitted_at);
alter table app_public.campaign_need add constraint campaign_need_current_status check(not is_current or status in ('pending','accepted'));
alter table app_public.campaign_resource add constraint campaign_resource_current_status check(not is_current or status in ('pending','accepted'));

create table app_public.campaign_listing_submission_event (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references app_public.campaign(id) on delete cascade,
  need_id uuid references app_public.need(id) on delete cascade,
  resource_id uuid references app_public.resource(id) on delete cascade,
  submission_id uuid not null,
  status app_public.campaign_need_status not null,
  rejection_note text,
  submitted_at timestamptz not null,
  acted_at timestamptz,
  actor_account_id uuid references app_public.account(id),
  created_at timestamptz not null default clock_timestamp(),
  check(num_nonnulls(need_id,resource_id)=1)
);
create index campaign_listing_submission_event_campaign_idx on app_public.campaign_listing_submission_event(campaign_id);
create index campaign_listing_submission_event_need_idx on app_public.campaign_listing_submission_event(need_id);
create index campaign_listing_submission_event_resource_idx on app_public.campaign_listing_submission_event(resource_id);
create index campaign_listing_submission_event_created_idx on app_public.campaign_listing_submission_event(created_at);
alter table app_public.campaign_listing_submission_event enable row level security;
create policy campaign_listing_submission_event_read on app_public.campaign_listing_submission_event for select using (
  exists(select 1 from app_public.campaign c where c.id=campaign_id and c.creator_account_id=app_private.current_account_id())
  or exists(select 1 from app_public.need n where n.id=need_id and n.creator_account_id=app_private.current_account_id())
  or exists(select 1 from app_public.resource r where r.id=resource_id and r.creator_account_id=app_private.current_account_id())
);
grant select on app_public.campaign_listing_submission_event to identified_account,admin;

drop function app_public.accept_campaign_need(uuid,uuid);
drop function app_public.reject_campaign_need(uuid,uuid);
drop function app_public.accept_campaign_resource(uuid,uuid);
drop function app_public.reject_campaign_resource(uuid,uuid);
drop function app_public.unlink_campaign_resource(uuid,uuid);

-- Immutable deployment copies of the canonical function sources follow.
-- Canonical campaign listing state machine. All callers lock the listing first.
create or replace function app_private.submit_campaign_listing(p_kind text, p_campaign_id uuid, p_listing_id uuid)
returns jsonb
language plpgsql
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account uuid := app_private.current_account_id();
  v_listing record;
  v_campaign app_public.campaign;
  v_current record;
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
    into v_listing using p_listing_id;
  if v_listing.creator_account_id is distinct from v_account then
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
  execute format('select l.* from app_public.%I l where l.%I=$1 and l.is_current', v_table, v_column)
    into v_current using p_listing_id;
  if v_current.campaign_id is not null then
    if v_current.campaign_id=p_campaign_id then
      -- Idempotent retries must never reset a decision or its protection period.
      execute format('select to_jsonb(l) from app_public.%I l where l.campaign_id=$1 and l.%I=$2', v_table, v_column)
        into v_result using p_campaign_id,p_listing_id;
      return v_result;
    end if;
    if v_current.status='accepted' then raise exception 'Listing is accepted until the campaign ends'; end if;
    if v_current.submitted_at + interval '24 hours' > v_now then
      raise exception 'Pending application cannot be replaced for 24 hours';
    end if;
  end if;
  if not v_listing.is_active or v_listing.expires_at <= v_now then
    raise exception '% is no longer active', initcap(p_kind);
  end if;
  if v_current.campaign_id is not null then
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
  v_link record;
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
  execute format('select * from app_public.%I where campaign_id=$1 and %I=$2',v_table,v_column)
    into v_link using p_campaign_id,p_listing_id;
  if v_link.submission_id is null or p_expected_submission_id is null
    or v_link.submission_id <> p_expected_submission_id or not v_link.is_current or v_link.status <> 'pending' then
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
create or replace function app_public.create_need(
  title text,
  description text default null,
  location text default null,
  intensity app_public.need_intensity default 'sharing',
  proposed_topes_amount integer default null,
  object_required boolean default false,
  competence_required boolean default false,
  tooling_required boolean default false,
  multiple_people_required boolean default false,
  required_competence_text text default null,
  required_tooling_text text default null,
  required_people_count integer default null,
  campaign_id uuid default null,
  latitude numeric default null,
  longitude numeric default null,
  image_urls text[] default array[]::text[],
  expires_at timestamptz default null
)
returns app_public.need
language plpgsql
as $$
declare
  v_account_id uuid;
  v_account_latitude numeric;
  v_account_longitude numeric;
  v_image_urls text[];
  v_need app_public.need;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  perform app_private.validate_topes_amount(create_need.intensity::text, create_need.proposed_topes_amount);
  perform app_private.validate_people_count(create_need.multiple_people_required, create_need.required_people_count);
  perform app_private.validate_campaign_linkability(create_need.campaign_id);

  select a.latitude, a.longitude
  into v_account_latitude, v_account_longitude
  from app_public.account a
  where a.id = v_account_id;

  v_image_urls := app_private.normalize_text_array(create_need.image_urls);

  insert into app_public.need (
    creator_account_id,
    title,
    description,
    location,
    latitude,
    longitude,
    intensity,
    proposed_topes_amount,
    object_required,
    competence_required,
    tooling_required,
    multiple_people_required,
    required_competence_text,
    required_tooling_text,
    required_people_count,
    image_urls,
    is_active,
    expires_at
  )
  values (
    v_account_id,
    nullif(btrim(create_need.title), ''),
    nullif(btrim(create_need.description), ''),
    nullif(btrim(create_need.location), ''),
    coalesce(create_need.latitude, v_account_latitude, 50.6072),
    coalesce(create_need.longitude, v_account_longitude, 3.3889),
    create_need.intensity,
    create_need.proposed_topes_amount,
    create_need.object_required,
    create_need.competence_required,
    create_need.tooling_required,
    create_need.multiple_people_required,
    nullif(btrim(create_need.required_competence_text), ''),
    nullif(btrim(create_need.required_tooling_text), ''),
    create_need.required_people_count,
    v_image_urls,
    true,
    create_need.expires_at
  )
  returning * into v_need;

  if create_need.campaign_id is not null then
    perform app_public.link_campaign_need(create_need.campaign_id, v_need.id);
  end if;

  return v_need;
end;
$$;

grant execute on function app_public.create_need(
  text,
  text,
  text,
  app_public.need_intensity,
  integer,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  text,
  integer,
  uuid,
  numeric,
  numeric,
  text[],
  timestamptz
) to identified_account, admin;

comment on function app_public.create_need(
  text,
  text,
  text,
  app_public.need_intensity,
  integer,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  text,
  integer,
  uuid,
  numeric,
  numeric,
  text[],
  timestamptz
) is '@name createNeed';
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
      join app_public.campaign nc on nc.id=cn.campaign_id
      where cn.status = 'accepted' and cn.acted_at <= nc.airdrop_at
      group by cn.campaign_id, n.creator_account_id
    ),
    approved_resource_counts as (
      select
        cr.campaign_id,
        r.creator_account_id as recipient_account_id,
        count(distinct cr.resource_id)::integer as approved_resource_count
      from app_public.campaign_resource cr
      join app_public.resource r on r.id = cr.resource_id
      join app_public.campaign rc on rc.id=cr.campaign_id
      where cr.status = 'accepted' and cr.acted_at <= rc.airdrop_at
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
      where cn.is_current and cn.status in ('pending','accepted')
      group by cn.campaign_id, n.creator_account_id
    ),
    linked_resource_counts as (
      select
        cr.campaign_id,
        r.creator_account_id as recipient_account_id,
        count(distinct cr.resource_id)::integer as linked_resource_count
      from app_public.campaign_resource cr
      join app_public.resource r on r.id = cr.resource_id
      where cr.is_current and cr.status in ('pending','accepted')
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

create trigger trg_campaign_need_submission after insert or update on app_public.campaign_need
  for each row execute function app_private.record_campaign_listing_submission();
create trigger trg_campaign_resource_submission after insert or update on app_public.campaign_resource
  for each row execute function app_private.record_campaign_listing_submission();

-- All application writes are functions-only, including for administrative accounts.
revoke insert,update,delete,truncate,references,trigger on app_public.campaign_need,app_public.campaign_resource
  from public,anonymous,identified_account,admin;
do $$ declare p record; begin
  for p in select tablename,policyname from pg_policies where schemaname='app_public'
    and tablename in ('campaign_need','campaign_resource') and cmd<>'SELECT' loop
    execute format('drop policy %I on app_public.%I',p.policyname,p.tablename);
  end loop;
end $$;
-- Explicit owner-scoped SELECT for both application roles; notes are not public.
drop policy if exists campaign_need_select_policy on app_public.campaign_need;
create policy campaign_need_select_policy on app_public.campaign_need for select using (
  exists(select 1 from app_public.campaign c where c.id=campaign_id and c.creator_account_id=app_private.current_account_id())
  or exists(select 1 from app_public.need n where n.id=need_id and n.creator_account_id=app_private.current_account_id())
);
grant select on app_public.campaign_need to identified_account,admin;
commit;