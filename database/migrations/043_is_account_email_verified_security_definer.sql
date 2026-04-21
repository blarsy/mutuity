begin;

create or replace function app_private.is_account_email_verified(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_private, app_public, public
as $$
  select exists (
    select 1
    from app_private.account_credential c
    where c.account_id = p_account_id
      and c.is_active = true
      and c.email_verified_at is not null
  );
$$;

commit;
