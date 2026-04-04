update app_private.account_session
set expires_at = now() - interval '1 minute'
where account_id = $1
  and revoked_at is null;
