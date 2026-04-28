-- Add moderation_status to admin_list_campaigns result and expose an optional
-- status filter parameter so the admin UI can narrow campaigns to a given
-- moderation lifecycle stage (e.g. show only pending ones).

create or replace function app_public.admin_list_campaigns(
  p_search text default null,
  p_status app_public.campaign_moderation_status default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  creator_name text,
  summary text,
  description text,
  moderation_status app_public.campaign_moderation_status,
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

  v_limit  := greatest(1, least(coalesce(p_limit, 50), 500));
  v_offset := greatest(0, coalesce(p_offset, 0));
  v_search := nullif(btrim(coalesce(p_search, '')), '');

  return query
  select
    c.id,
    a.display_name                   as creator_name,
    c.title                          as summary,
    c.manager_note_from_creator      as description,
    c.moderation_status,
    c.airdrop_at                     as airdrop_datetime,
    c.airdrop_amount                 as airdrop_token_amount,
    c.start_at                       as begin_datetime,
    c.end_at                         as end_datetime,
    c.rewards_multiplier             as resource_rewards_multiplier,
    c.created_at
  from app_public.campaign c
  join app_public.account  a on a.id = c.creator_account_id
  where (
    v_search is null
    or coalesce(c.title,                        '') ilike ('%' || v_search || '%')
    or coalesce(c.manager_note_from_creator,    '') ilike ('%' || v_search || '%')
    or coalesce(a.display_name,                 '') ilike ('%' || v_search || '%')
  )
  and (p_status is null or c.moderation_status = p_status)
  order by c.created_at desc
  limit v_limit
  offset v_offset;
end;
$$;

-- Permissions already granted to admin in migration 059; the replace preserves them,
-- but we explicitly ensure public is revoked for the new signature as well.
grant execute on function app_public.admin_list_campaigns(
  text, app_public.campaign_moderation_status, integer, integer
) to admin;

revoke all on function app_public.admin_list_campaigns(
  text, app_public.campaign_moderation_status, integer, integer
) from public;

comment on function app_public.admin_list_campaigns(
  text, app_public.campaign_moderation_status, integer, integer
) is '@name adminListCampaigns';
