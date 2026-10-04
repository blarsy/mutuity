begin;

create or replace function app_public.link_campaign_resource(p_campaign_id uuid, p_resource_id uuid)
returns app_public.campaign_resource
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_resource app_public.resource;
  v_campaign app_public.campaign;
  v_link app_public.campaign_resource;
begin
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;
  select * into v_resource from app_public.resource where id=p_resource_id for update;
  if not found or v_resource.creator_account_id <> v_account_id then
    raise exception using message = 'Only the resource creator can join a campaign';
  end if;
  -- Idempotent retries must not reset a previously triaged relation.
  select * into v_link from app_public.campaign_resource
  where campaign_id=p_campaign_id and resource_id=p_resource_id;
  if found then return v_link; end if;
  select * into v_campaign from app_public.campaign where id=p_campaign_id for share;
  if not found or v_campaign.moderation_status <> 'approved'
     or v_campaign.start_at > now() or v_campaign.end_at < now() then
    raise exception using message = 'Campaign is not currently linkable';
  end if;
  if not v_resource.is_active or (v_resource.expires_at is not null and v_resource.expires_at <= now()) then
    raise exception using message = 'Resource is no longer active';
  end if;
  insert into app_public.campaign_resource (campaign_id,resource_id,status)
  values (p_campaign_id,p_resource_id,'pending') returning * into v_link;
  return v_link;
end;
$$;

create or replace function app_public.unlink_campaign_resource(p_campaign_id uuid, p_resource_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, app_public, app_private
as $$
declare
  v_account_id uuid := app_private.current_account_id();
  v_resource_owner uuid;
  v_campaign_owner uuid;
begin
  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;
  select creator_account_id into v_resource_owner from app_public.resource where id=p_resource_id for update;
  select creator_account_id into v_campaign_owner from app_public.campaign where id=p_campaign_id;
  -- Preserve the existing explicit administrative unlink capability; normal
  -- accounts must own one side. Admin status never permits linking/triage.
  if not app_private.is_admin()
     and v_account_id is distinct from v_resource_owner
     and v_account_id is distinct from v_campaign_owner then
    raise exception using message = 'Only campaign or resource creators can unlink';
  end if;
  delete from app_public.campaign_resource where campaign_id=p_campaign_id and resource_id=p_resource_id;
  return found;
end;
$$;

revoke all on function app_public.link_campaign_resource(uuid,uuid) from public;
revoke all on function app_public.unlink_campaign_resource(uuid,uuid) from public;
grant execute on function app_public.link_campaign_resource(uuid,uuid) to identified_account,admin;
grant execute on function app_public.unlink_campaign_resource(uuid,uuid) to identified_account,admin;
comment on function app_public.link_campaign_resource(uuid,uuid) is '@name linkCampaignResource';
comment on function app_public.unlink_campaign_resource(uuid,uuid) is '@name unlinkCampaignResource';

revoke insert,update,delete,truncate,references,trigger on app_public.campaign_resource
from public,anonymous,identified_account,admin;
drop policy if exists campaign_resource_insert_policy on app_public.campaign_resource;
drop policy if exists campaign_resource_update_policy on app_public.campaign_resource;
drop policy if exists campaign_resource_delete_policy on app_public.campaign_resource;

-- Request derives the account from the session; confirmation requires a valid
-- expiring one-use token delivered to the NEW address. No ownership override.
grant execute on function app_public.request_account_email_change(text,bigint,bigint) to admin;
grant execute on function app_public.confirm_account_email_change(text) to admin;

commit;