insert into app_public.resource (
  creator_account_id,
  title,
  description,
  location,
  latitude,
  longitude,
  intensity,
  default_token_amount,
  is_product,
  is_service,
  can_be_given,
  can_be_exchanged,
  can_be_taken_away,
  can_be_delivered,
  is_active,
  expires_at
)
values (
  $1, $2, $3, $4, $5, $6, $7::app_public.need_intensity, $8, $9, $10, $11, $12, $13, $14, $15, $16
)
returning id, title, location, latitude, longitude, expires_at, is_active;
