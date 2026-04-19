insert into app_private.account_credential (
  account_id,
  login_identifier,
  password_hash,
  role_name,
  is_active,
  email_verified_at
)
values ($1, $2, $3, $4, true, now())
on conflict (account_id) do update
set login_identifier = excluded.login_identifier,
    password_hash = excluded.password_hash,
    role_name = excluded.role_name,
    is_active = excluded.is_active,
    email_verified_at = excluded.email_verified_at,
    updated_at = now();
