insert into app_private.account_credential (
  account_id,
  login_identifier,
  password_hash,
  role_name,
  is_active
)
values ($1, $2, $3, $4, true)
on conflict (account_id) do update
set login_identifier = excluded.login_identifier,
    password_hash = excluded.password_hash,
    role_name = excluded.role_name,
    is_active = excluded.is_active,
    updated_at = now();
