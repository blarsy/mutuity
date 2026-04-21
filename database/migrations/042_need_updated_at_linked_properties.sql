begin;

drop function if exists app_private.touch_need_updated_at_from_campaign_need();
create or replace function app_private.touch_need_updated_at_from_campaign_need()
returns trigger
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_need_id uuid := coalesce(new.need_id, old.need_id);
begin
  if v_need_id is null then
    return coalesce(new, old);
  end if;

  update app_public.need
  set updated_at = now()
  where id = v_need_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_campaign_need_touch_need_updated_at
  on app_public.campaign_need;
create trigger trg_campaign_need_touch_need_updated_at
  after insert or update or delete on app_public.campaign_need
  for each row
  execute function app_private.touch_need_updated_at_from_campaign_need();

commit;
