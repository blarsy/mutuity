begin;

create table if not exists audit.event (
  id bigserial primary key,
  table_name text not null,
  action text not null,
  actor_account_id uuid,
  actor_role text,
  row_pk jsonb not null,
  old_row jsonb,
  new_row jsonb,
  created_at timestamptz not null default now()
);

create or replace function audit.log_row_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor_account_id uuid;
  v_actor_role text;
  v_pk jsonb;
begin
  v_actor_account_id := nullif(current_setting('jwt.claims.account_id', true), '')::uuid;
  v_actor_role := coalesce(nullif(current_setting('jwt.claims.role', true), ''), current_user);

  if tg_op = 'INSERT' then
    if to_jsonb(new) ? 'id' then
      v_pk := jsonb_build_object('id', to_jsonb(new) -> 'id');
    else
      v_pk := jsonb_build_object('campaign_id', to_jsonb(new) -> 'campaign_id', 'need_id', to_jsonb(new) -> 'need_id');
    end if;
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) ? 'id' or to_jsonb(old) ? 'id' then
      v_pk := jsonb_build_object('id', coalesce(to_jsonb(new) -> 'id', to_jsonb(old) -> 'id'));
    else
      v_pk := jsonb_build_object(
        'campaign_id',
        coalesce(to_jsonb(new) -> 'campaign_id', to_jsonb(old) -> 'campaign_id'),
        'need_id',
        coalesce(to_jsonb(new) -> 'need_id', to_jsonb(old) -> 'need_id')
      );
    end if;
  else
    if to_jsonb(old) ? 'id' then
      v_pk := jsonb_build_object('id', to_jsonb(old) -> 'id');
    else
      v_pk := jsonb_build_object('campaign_id', to_jsonb(old) -> 'campaign_id', 'need_id', to_jsonb(old) -> 'need_id');
    end if;
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
    v_pk,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger trg_audit_campaign
  after insert or update or delete on app_public.campaign
  for each row
  execute function audit.log_row_change();

create trigger trg_audit_need
  after insert or update or delete on app_public.need
  for each row
  execute function audit.log_row_change();

create trigger trg_audit_campaign_need
  after insert or update or delete on app_public.campaign_need
  for each row
  execute function audit.log_row_change();

alter table audit.event enable row level security;

create policy audit_event_select_policy on audit.event
  for select
  using (app_private.is_manager());

grant select on audit.event to manager, admin;

commit;
