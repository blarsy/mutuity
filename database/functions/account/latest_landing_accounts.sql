drop function if exists app_public.latest_landing_accounts(integer);

create or replace function app_public.latest_landing_accounts(limit_count integer default 10)
returns setof app_public.account
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select a.*
  from app_public.account a
  where a.avatar_url is not null
    and a.external_subject not like 'deleted-%'
    and app_private.is_account_email_verified(a.id)
    and (
      exists (
        select 1
        from app_public.resource r
        where r.creator_account_id = a.id
          and r.is_active
      )
      or exists (
        select 1
        from app_public.need n
        where n.creator_account_id = a.id
          and n.is_active
      )
    )
  order by a.created_at desc, a.id desc
  limit least(greatest(coalesce(limit_count, 10), 1), 50)
$$;

comment on function app_public.latest_landing_accounts(integer) is '@name latestLandingAccounts';
