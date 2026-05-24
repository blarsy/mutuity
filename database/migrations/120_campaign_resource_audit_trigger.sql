begin;

create or replace function audit.log_campaign_resource_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_account_id uuid;
  v_actor_role text;
  v_campaign_id jsonb;
  v_resource_id jsonb;
begin
  v_actor_account_id := nullif(current_setting('jwt.claims.account_id', true), '')::uuid;
  v_actor_role := coalesce(nullif(current_setting('jwt.claims.role', true), ''), current_user);

  if tg_op = 'INSERT' then
    v_campaign_id := to_jsonb(new) -> 'campaign_id';
    v_resource_id := to_jsonb(new) -> 'resource_id';
  elsif tg_op = 'UPDATE' then
    v_campaign_id := coalesce(to_jsonb(new) -> 'campaign_id', to_jsonb(old) -> 'campaign_id');
    v_resource_id := coalesce(to_jsonb(new) -> 'resource_id', to_jsonb(old) -> 'resource_id');
  else
    v_campaign_id := to_jsonb(old) -> 'campaign_id';
    v_resource_id := to_jsonb(old) -> 'resource_id';
  end if;

  insert into audit.event (
    table_name,
    action,
    actor_account_id,
    actor_role,
    row_pk,
    old_row,
    new_row
  )
  values (
    tg_table_schema || '.' || tg_table_name,
    tg_op,
    v_actor_account_id,
    v_actor_role,
    jsonb_build_object('campaign_id', v_campaign_id, 'resource_id', v_resource_id),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists trg_audit_campaign_resource on app_public.campaign_resource;

create trigger trg_audit_campaign_resource
  after insert or update or delete on app_public.campaign_resource
  for each row
  execute function audit.log_campaign_resource_change();

commit;
