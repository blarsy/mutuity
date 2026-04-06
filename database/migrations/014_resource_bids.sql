begin;

do $$
begin
  create type app_public.resource_bid_status as enum (
    'open',
    'accepted',
    'declined',
    'withdrawn',
    'expired'
  );
exception
  when duplicate_object then null;
end;
$$;

create table if not exists app_public.resource_bid (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references app_public.resource(id) on delete cascade,
  bidder_account_id uuid not null references app_public.account(id) on delete cascade,
  message text,
  proposed_token_amount integer,
  status app_public.resource_bid_status not null default 'open',
  responded_at timestamptz,
  responded_by_account_id uuid references app_public.account(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_bid_unique_per_account unique (resource_id, bidder_account_id),
  constraint resource_bid_message_present check (message is null or btrim(message) <> ''),
  constraint resource_bid_proposed_token_amount_positive check (
    proposed_token_amount is null or proposed_token_amount > 0
  )
);

create table if not exists app_public.resource_bid_notification (
  id uuid primary key default gen_random_uuid(),
  recipient_account_id uuid not null references app_public.account(id) on delete cascade,
  resource_bid_id uuid not null references app_public.resource_bid(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists resource_bid_resource_id_idx
  on app_public.resource_bid (resource_id, created_at desc);

create index if not exists resource_bid_bidder_account_id_idx
  on app_public.resource_bid (bidder_account_id, created_at desc);

create index if not exists resource_bid_status_idx
  on app_public.resource_bid (status, created_at desc);

create index if not exists resource_bid_notification_recipient_idx
  on app_public.resource_bid_notification (recipient_account_id, created_at desc);

create index if not exists resource_bid_notification_bid_id_idx
  on app_public.resource_bid_notification (resource_bid_id, created_at desc);

drop trigger if exists trg_resource_bid_set_updated_at on app_public.resource_bid;
create trigger trg_resource_bid_set_updated_at
  before update on app_public.resource_bid
  for each row
  execute function app_private.set_updated_at();

alter table app_public.resource_bid enable row level security;
alter table app_public.resource_bid_notification enable row level security;

drop policy if exists account_resource_bid_participant_select_policy on app_public.account;
create policy account_resource_bid_participant_select_policy on app_public.account
  for select
  using (
    app_private.is_manager()
    or exists (
      select 1
      from app_public.resource_bid rb
      join app_public.resource r on r.id = rb.resource_id
      where (
        rb.bidder_account_id = app_public.account.id
        and r.creator_account_id = app_private.current_account_id()
      )
      or (
        r.creator_account_id = app_public.account.id
        and rb.bidder_account_id = app_private.current_account_id()
      )
    )
  );

drop policy if exists resource_bid_select_policy on app_public.resource_bid;
create policy resource_bid_select_policy on app_public.resource_bid
  for select
  using (
    app_private.is_manager()
    or bidder_account_id = app_private.current_account_id()
    or exists (
      select 1
      from app_public.resource r
      where r.id = resource_id
        and r.creator_account_id = app_private.current_account_id()
    )
  );

drop policy if exists resource_bid_notification_select_policy on app_public.resource_bid_notification;
create policy resource_bid_notification_select_policy on app_public.resource_bid_notification
  for select
  using (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  );

drop policy if exists resource_bid_notification_update_policy on app_public.resource_bid_notification;
create policy resource_bid_notification_update_policy on app_public.resource_bid_notification
  for update
  using (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  )
  with check (
    app_private.is_manager()
    or recipient_account_id = app_private.current_account_id()
  );

grant select on app_public.resource_bid to identified_account, manager, admin;
grant select, update on app_public.resource_bid_notification to identified_account, manager, admin;

create or replace function app_private.create_resource_bid_notification(
  p_recipient_account_id uuid,
  p_resource_bid_id uuid,
  p_event_type text,
  p_payload jsonb default '{}'::jsonb
)
returns app_public.resource_bid_notification
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_notification app_public.resource_bid_notification;
begin
  insert into app_public.resource_bid_notification (
    recipient_account_id,
    resource_bid_id,
    event_type,
    payload
  )
  values (
    p_recipient_account_id,
    p_resource_bid_id,
    p_event_type,
    coalesce(p_payload, '{}'::jsonb)
  )
  returning * into v_notification;

  return v_notification;
end;
$$;

drop function if exists app_public.create_resource_bid(uuid, text, integer);

create or replace function app_public.create_resource_bid(
  resource_id uuid,
  message text default null,
  proposed_token_amount integer default null
)
returns app_public.resource_bid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_resource app_public.resource;
  v_existing_bid app_public.resource_bid;
  v_bid app_public.resource_bid;
  v_effective_token_amount integer;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  select *
  into v_resource
  from app_public.resource r
  where r.id = create_resource_bid.resource_id
  for update;

  if not found then
    raise exception using message = 'Resource not found';
  end if;

  if v_resource.creator_account_id = v_account_id then
    raise exception using message = 'Resource creators cannot bid on their own resources';
  end if;

  if not v_resource.is_active then
    raise exception using message = 'Resource is no longer active';
  end if;

  if v_resource.expires_at is not null and v_resource.expires_at <= now() then
    raise exception using message = 'Resource has expired';
  end if;

  select *
  into v_existing_bid
  from app_public.resource_bid rb
  where rb.resource_id = create_resource_bid.resource_id
    and rb.bidder_account_id = v_account_id
  for update;

  if found and v_existing_bid.status = 'accepted' then
    return v_existing_bid;
  end if;

  v_effective_token_amount := coalesce(
    create_resource_bid.proposed_token_amount,
    v_resource.default_token_amount
  );

  if v_effective_token_amount is not null then
    perform app_private.validate_topes_amount(v_resource.intensity::text, v_effective_token_amount);
  end if;

  insert into app_public.resource_bid (
    resource_id,
    bidder_account_id,
    message,
    proposed_token_amount,
    status
  )
  values (
    create_resource_bid.resource_id,
    v_account_id,
    nullif(btrim(create_resource_bid.message), ''),
    v_effective_token_amount,
    'open'
  )
  on conflict on constraint resource_bid_unique_per_account do update
  set message = excluded.message,
      proposed_token_amount = excluded.proposed_token_amount,
      status = case
        when app_public.resource_bid.status in ('declined', 'withdrawn', 'expired')
          then 'open'::app_public.resource_bid_status
        else app_public.resource_bid.status
      end,
      responded_at = case
        when app_public.resource_bid.status in ('declined', 'withdrawn', 'expired') then null
        else app_public.resource_bid.responded_at
      end,
      responded_by_account_id = case
        when app_public.resource_bid.status in ('declined', 'withdrawn', 'expired') then null
        else app_public.resource_bid.responded_by_account_id
      end,
      updated_at = now()
  returning * into v_bid;

  perform app_private.create_resource_bid_notification(
    v_resource.creator_account_id,
    v_bid.id,
    'resource_bid_created',
    jsonb_build_object(
      'resourceId', v_resource.id,
      'bidderAccountId', v_account_id,
      'status', v_bid.status,
      'proposedTokenAmount', v_bid.proposed_token_amount
    )
  );

  return v_bid;
end;
$$;

drop function if exists app_public.respond_to_resource_bid(uuid, app_public.resource_bid_status);

create or replace function app_public.respond_to_resource_bid(
  resource_bid_id uuid,
  status app_public.resource_bid_status
)
returns app_public.resource_bid
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_context record;
  v_bid app_public.resource_bid;
  v_event_type text;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  if respond_to_resource_bid.status not in ('accepted', 'declined') then
    raise exception using message = 'Resource bid response must be accepted or declined';
  end if;

  select
    rb.*,
    r.creator_account_id as resource_creator_account_id,
    r.is_active as resource_is_active,
    r.expires_at as resource_expires_at
  into v_context
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  where rb.id = respond_to_resource_bid.resource_bid_id
  for update of rb, r;

  if not found then
    raise exception using message = 'Resource bid not found';
  end if;

  if not app_private.is_manager() and v_context.resource_creator_account_id <> v_account_id then
    raise exception using message = 'Only the resource creator can respond to bids';
  end if;

  if not v_context.resource_is_active then
    raise exception using message = 'Resource is no longer active';
  end if;

  if v_context.resource_expires_at is not null and v_context.resource_expires_at <= now() then
    update app_public.resource_bid
    set status = case when status = 'open' then 'expired'::app_public.resource_bid_status else status end,
        updated_at = now()
    where id = v_context.id;

    raise exception using message = 'Resource has expired';
  end if;

  if v_context.status <> 'open' then
    if v_context.status = respond_to_resource_bid.status then
      return v_context;
    end if;

    raise exception using message = 'Resource bid is no longer open';
  end if;

  update app_public.resource_bid
  set status = respond_to_resource_bid.status,
      responded_at = now(),
      responded_by_account_id = v_account_id,
      updated_at = now()
  where id = respond_to_resource_bid.resource_bid_id
  returning * into v_bid;

  v_event_type := case
    when v_bid.status = 'accepted' then 'resource_bid_accepted'
    else 'resource_bid_declined'
  end;

  perform app_private.create_resource_bid_notification(
    v_bid.bidder_account_id,
    v_bid.id,
    v_event_type,
    jsonb_build_object(
      'resourceId', v_bid.resource_id,
      'status', v_bid.status,
      'respondedByAccountId', v_account_id
    )
  );

  return v_bid;
end;
$$;

grant execute on function app_private.create_resource_bid_notification(uuid, uuid, text, jsonb)
  to identified_account, manager, admin;
grant execute on function app_public.create_resource_bid(uuid, text, integer)
  to identified_account, manager, admin;
grant execute on function app_public.respond_to_resource_bid(uuid, app_public.resource_bid_status)
  to identified_account, manager, admin;

comment on table app_public.resource_bid is 'Responses and negotiations created by interested accounts on resources.';
comment on table app_public.resource_bid_notification is 'Notification events emitted when resource bid lifecycle changes occur.';
comment on function app_public.create_resource_bid(uuid, text, integer) is '@name submitResourceBid';
comment on function app_public.respond_to_resource_bid(uuid, app_public.resource_bid_status) is '@name respondToResourceBid';

commit;
