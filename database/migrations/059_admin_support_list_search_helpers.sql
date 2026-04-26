begin;

create index if not exists account_created_at_idx
  on app_public.account (created_at desc);

create index if not exists account_notification_created_at_idx
  on app_public.account_notification (created_at desc);

create index if not exists mail_outbox_created_at_idx
  on app_private.mail_outbox (created_at desc);

create index if not exists campaign_created_at_idx
  on app_public.campaign (created_at desc);

create or replace function app_public.admin_list_accounts(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  email text,
  language text,
  token_amount integer,
  created_at timestamptz,
  address text
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  with account_email as (
    select
      a.id as account_id,
      coalesce(
        (
          select ai.provider_email_normalized
          from app_private.account_identity ai
          where ai.account_id = a.id
            and ai.provider_email_normalized is not null
          order by ai.provider_email_verified desc, ai.created_at asc
          limit 1
        ),
        (
          select lower(ac.login_identifier)
          from app_private.account_credential ac
          where ac.account_id = a.id
            and ac.is_active = true
          order by ac.created_at asc
          limit 1
        ),
        lower(a.external_subject)
      ) as resolved_email
    from app_public.account a
  )
  select
    a.id,
    a.display_name as name,
    ae.resolved_email as email,
    a.preferred_language as language,
    coalesce((
      select sum(tm.amount_delta)::integer
      from app_public.token_movement tm
      where tm.account_id = a.id
    ), 0)::integer as token_amount,
    a.created_at,
    a.location as address
  from app_public.account a
  join account_email ae on ae.account_id = a.id
  where (
    v_search is null
    or coalesce(a.display_name, '') ilike ('%' || v_search || '%')
    or coalesce(ae.resolved_email, '') ilike ('%' || v_search || '%')
  )
  order by a.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_bids(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  bidder_name text,
  receiver_name text,
  resource_title text,
  intensity app_public.need_intensity,
  token_amount integer,
  status app_public.resource_bid_status,
  created_at timestamptz,
  expiration_datetime timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    rb.id,
    bidder.display_name as bidder_name,
    receiver.display_name as receiver_name,
    r.title as resource_title,
    r.intensity,
    rb.proposed_token_amount as token_amount,
    rb.status,
    rb.created_at,
    r.expires_at as expiration_datetime
  from app_public.resource_bid rb
  join app_public.resource r on r.id = rb.resource_id
  join app_public.account bidder on bidder.id = rb.bidder_account_id
  join app_public.account receiver on receiver.id = r.creator_account_id
  where (
    v_search is null
    or coalesce(bidder.display_name, '') ilike ('%' || v_search || '%')
    or coalesce(receiver.display_name, '') ilike ('%' || v_search || '%')
    or coalesce(r.title, '') ilike ('%' || v_search || '%')
  )
  order by rb.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_resources(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  creator_name text,
  intensity app_public.need_intensity,
  token_amount integer,
  image_count integer,
  location text,
  created_at timestamptz,
  expiration_datetime timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    r.id,
    r.title,
    a.display_name as creator_name,
    r.intensity,
    r.default_token_amount as token_amount,
    cardinality(coalesce(r.image_urls, array[]::text[]))::integer as image_count,
    r.location,
    r.created_at,
    r.expires_at as expiration_datetime
  from app_public.resource r
  join app_public.account a on a.id = r.creator_account_id
  where (
    v_search is null
    or coalesce(r.title, '') ilike ('%' || v_search || '%')
    or coalesce(r.description, '') ilike ('%' || v_search || '%')
    or coalesce(a.display_name, '') ilike ('%' || v_search || '%')
  )
  order by r.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_notifications(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  account_name text,
  data jsonb,
  created_at timestamptz,
  read_at timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    n.id,
    a.display_name as account_name,
    n.payload as data,
    n.created_at,
    n.read_at
  from app_public.account_notification n
  join app_public.account a on a.id = n.recipient_account_id
  where (
    v_search is null
    or coalesce(a.display_name, '') ilike ('%' || v_search || '%')
    or coalesce(n.payload::text, '') ilike ('%' || v_search || '%')
  )
  order by n.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_mails(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  subject text,
  recipient_account_name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    m.id,
    m.recipient_email as email,
    m.subject,
    a.display_name as recipient_account_name,
    m.created_at
  from app_private.mail_outbox m
  left join app_public.account a on a.id = m.account_id
  where (
    v_search is null
    or coalesce(m.recipient_email, '') ilike ('%' || v_search || '%')
    or coalesce(m.subject, '') ilike ('%' || v_search || '%')
    or coalesce(a.display_name, '') ilike ('%' || v_search || '%')
  )
  order by m.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_campaigns(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  creator_name text,
  summary text,
  description text,
  airdrop_datetime timestamptz,
  airdrop_token_amount integer,
  begin_datetime timestamptz,
  end_datetime timestamptz,
  resource_rewards_multiplier integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    c.id,
    a.display_name as creator_name,
    c.title as summary,
    c.manager_note_from_creator as description,
    c.airdrop_at as airdrop_datetime,
    c.airdrop_amount as airdrop_token_amount,
    c.start_at as begin_datetime,
    c.end_at as end_datetime,
    c.rewards_multiplier as resource_rewards_multiplier,
    c.created_at
  from app_public.campaign c
  join app_public.account a on a.id = c.creator_account_id
  where (
    v_search is null
    or coalesce(c.title, '') ilike ('%' || v_search || '%')
    or coalesce(c.manager_note_from_creator, '') ilike ('%' || v_search || '%')
    or coalesce(a.display_name, '') ilike ('%' || v_search || '%')
  )
  order by c.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_grants(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  title text,
  description text,
  expiration_datetime timestamptz,
  amount_granted integer,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    g.id,
    g.title,
    g.description,
    g.expires_at as expiration_datetime,
    g.awarded_token_amount as amount_granted,
    g.created_at
  from app_public.grant_definition g
  where (
    v_search is null
    or coalesce(g.title, '') ilike ('%' || v_search || '%')
    or coalesce(g.description, '') ilike ('%' || v_search || '%')
  )
  order by g.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

create or replace function app_public.admin_list_logs(
  p_search text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  component text,
  "timestamp" timestamptz,
  severity text,
  message text,
  context text
)
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_limit integer;
  v_offset integer;
  v_search text;
begin
  if not app_private.is_admin() then
    raise exception using message = 'Only administrators can access admin support data';
  end if;

  v_limit := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    l.component,
    l.created_at as "timestamp",
    l.level as severity,
    l.message,
    l.context
  from app_public.operational_log l
  where (
    v_search is null
    or coalesce(l.component, '') ilike ('%' || v_search || '%')
    or coalesce(l.message, '') ilike ('%' || v_search || '%')
    or coalesce(l.context, '') ilike ('%' || v_search || '%')
  )
  order by l.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

grant execute on function app_public.admin_list_accounts(text, integer, integer) to admin;
grant execute on function app_public.admin_list_bids(text, integer, integer) to admin;
grant execute on function app_public.admin_list_resources(text, integer, integer) to admin;
grant execute on function app_public.admin_list_notifications(text, integer, integer) to admin;
grant execute on function app_public.admin_list_mails(text, integer, integer) to admin;
grant execute on function app_public.admin_list_campaigns(text, integer, integer) to admin;
grant execute on function app_public.admin_list_grants(text, integer, integer) to admin;
grant execute on function app_public.admin_list_logs(text, integer, integer) to admin;

revoke all on function app_public.admin_list_accounts(text, integer, integer) from public;
revoke all on function app_public.admin_list_bids(text, integer, integer) from public;
revoke all on function app_public.admin_list_resources(text, integer, integer) from public;
revoke all on function app_public.admin_list_notifications(text, integer, integer) from public;
revoke all on function app_public.admin_list_mails(text, integer, integer) from public;
revoke all on function app_public.admin_list_campaigns(text, integer, integer) from public;
revoke all on function app_public.admin_list_grants(text, integer, integer) from public;
revoke all on function app_public.admin_list_logs(text, integer, integer) from public;

comment on function app_public.admin_list_accounts(text, integer, integer) is '@name adminListAccounts';
comment on function app_public.admin_list_bids(text, integer, integer) is '@name adminListBids';
comment on function app_public.admin_list_resources(text, integer, integer) is '@name adminListResources';
comment on function app_public.admin_list_notifications(text, integer, integer) is '@name adminListNotifications';
comment on function app_public.admin_list_mails(text, integer, integer) is '@name adminListMails';
comment on function app_public.admin_list_campaigns(text, integer, integer) is '@name adminListCampaigns';
comment on function app_public.admin_list_grants(text, integer, integer) is '@name adminListGrants';
comment on function app_public.admin_list_logs(text, integer, integer) is '@name adminListLogs';

commit;
