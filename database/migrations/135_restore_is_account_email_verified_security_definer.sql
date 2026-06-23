-- Migration 133 switched is_account_email_verified to read app_public.account but
-- dropped security definer. Anonymous need/resource/account RLS policies call this
-- helper while evaluating account rows, which caused infinite recursion.

begin;

create or replace function app_private.is_account_email_verified(p_account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = app_public, app_private, public
as $$
  select exists (
    select 1
    from app_public.account a
    where a.id = p_account_id
      and a.activation_verified_at is not null
  );
$$;

commit;
