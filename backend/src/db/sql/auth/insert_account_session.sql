insert into app_private.account_session (
  account_id,
  role_name,
  session_token_hash,
  expires_at
)
values ($1, $2, $3, $4)
returning id;
