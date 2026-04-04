select
  a.id as account_id,
  a.display_name,
  a.external_subject,
  c.password_hash,
  c.role_name
from app_private.account_credential c
join app_public.account a on a.id = c.account_id
where lower(c.login_identifier) = lower($1)
  and c.is_active = true
limit 1;
