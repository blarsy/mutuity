create or replace function app_private.validate_campaign_linkability(p_campaign_id uuid)
returns void
language plpgsql
as $$
declare
  v_is_linkable boolean;
begin
  if p_campaign_id is null then
    return;
  end if;

  select exists (
    select 1
    from app_public.campaign c
    where c.id = p_campaign_id
      and c.moderation_status = 'approved'
      and c.start_at <= now()
      and c.end_at >= now()
  )
  into v_is_linkable;

  if not v_is_linkable then
    raise exception using message = 'Campaign is not eligible for need linking';
  end if;
end;
$$;

grant execute on function app_private.validate_campaign_linkability(uuid)
  to identified_account, manager, admin;
