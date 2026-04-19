begin;

create or replace function app_private.hash_local_password(
  p_password text
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
begin
  if nullif(btrim(p_password), '') is null then
    raise exception using message = 'Password must not be empty';
  end if;

  return crypt(p_password, gen_salt('bf'));
end;
$$;

create or replace function app_public.register_local_account_with_password(
  identifier text,
  display_name text,
  password text,
  verification_ttl_ms bigint default 86400000
)
returns text
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_password_hash text;
begin
  v_password_hash := app_private.hash_local_password(password);

  return app_public.register_local_account(
    identifier,
    display_name,
    v_password_hash,
    verification_ttl_ms
  );
end;
$$;

create or replace function app_public.confirm_password_reset_with_password(
  token text,
  next_password text
)
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_password_hash text;
begin
  v_password_hash := app_private.hash_local_password(next_password);

  return app_public.confirm_password_reset(token, v_password_hash);
end;
$$;

grant execute on function app_public.register_local_account_with_password(text, text, text, bigint)
  to anonymous;
grant execute on function app_public.confirm_password_reset_with_password(text, text)
  to anonymous;
grant execute on function app_private.hash_local_password(text)
  to identified_account, manager, admin;

comment on function app_public.register_local_account_with_password(text, text, text, bigint)
  is '@name registerLocalAccountWithPassword';
comment on function app_public.confirm_password_reset_with_password(text, text)
  is '@name confirmPasswordResetWithPassword';

revoke all on function app_private.hash_local_password(text) from public;

commit;
