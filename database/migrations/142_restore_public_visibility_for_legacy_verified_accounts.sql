begin;

update app_public.account a
set activation_verified_at = coalesce(
  a.activation_verified_at,
  (
    select min(c.email_verified_at)
    from app_private.account_credential c
    where c.account_id = a.id
      and c.is_active = true
      and c.email_verified_at is not null
  ),
  (
    select min(coalesce(ai.updated_at, ai.linked_at, ai.created_at))
    from app_private.account_identity ai
    where ai.account_id = a.id
      and ai.provider in ('google', 'apple')
      and ai.provider_email_verified = true
  )
)
where a.activation_verified_at is null
  and (
    exists (
      select 1
      from app_private.account_credential c
      where c.account_id = a.id
        and c.is_active = true
        and c.email_verified_at is not null
    )
    or exists (
      select 1
      from app_private.account_identity ai
      where ai.account_id = a.id
        and ai.provider in ('google', 'apple')
        and ai.provider_email_verified = true
    )
  );

create or replace function app_private.is_account_email_verified(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select (
    exists (
      select 1
      from app_public.account a
      where a.id = p_account_id
        and a.activation_verified_at is not null
    )
    or exists (
      select 1
      from app_private.account_credential c
      where c.account_id = p_account_id
        and c.is_active = true
        and c.email_verified_at is not null
    )
    or exists (
      select 1
      from app_private.account_identity ai
      where ai.account_id = p_account_id
        and ai.provider in ('google', 'apple')
        and ai.provider_email_verified = true
    )
  );
$$;

commit;