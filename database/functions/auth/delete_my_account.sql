create or replace function app_public.delete_my_account()
returns boolean
language plpgsql
security definer
set search_path = app_public, app_private, public
as $$
declare
  v_account_id uuid;
  v_deleted_subject text;
begin
  v_account_id := app_private.current_account_id();

  if v_account_id is null then
    raise exception using message = 'Authentication required';
  end if;

  v_deleted_subject := 'deleted-' || encode(gen_random_bytes(8), 'hex');

  update app_public.account
  set external_subject = case
      when external_subject like 'deleted-%' then external_subject
      else v_deleted_subject
    end,
    display_name = 'Deleted account',
    bio = null,
    location = null,
    avatar_url = null,
    profile_links = '[]'::jsonb,
    latitude = null,
    longitude = null,
    updated_at = now()
  where id = v_account_id;

  update app_private.account_credential
  set login_identifier = 'deleted+' || v_account_id::text || '@mutuity.invalid',
    password_hash = encode(gen_random_bytes(32), 'hex'),
    is_active = false,
    email_verified_at = null,
    updated_at = now()
  where account_id = v_account_id;

  delete from app_private.account_auth_token
  where account_id = v_account_id;

  perform app_private.revoke_account_sessions(v_account_id);

  insert into app_public.operational_log (
    level,
    component,
    message,
    account_id,
    metadata
  )
  values (
    'info',
    'web_api',
    'account_deletion_anonymized',
    v_account_id,
    jsonb_build_object('event', 'account_deletion_anonymized')
  );

  return true;
end;
$$;

grant execute on function app_public.delete_my_account() to identified_account, admin;

revoke all on function app_public.delete_my_account() from public;

comment on function app_public.delete_my_account() is '@name deleteMyAccount';
