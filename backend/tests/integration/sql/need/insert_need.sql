insert into app_public.need (
  creator_account_id,
  title,
  description,
  location,
  latitude,
  longitude,
  intensity,
  proposed_topes_amount,
  object_required,
  competence_required,
  tooling_required,
  multiple_people_required,
  required_competence_text,
  required_tooling_text,
  required_people_count,
  is_active,
  expires_at
)
values (
  $1, $2, $3, $4, $5, $6, $7::app_public.need_intensity, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
)
returning id, title, location, latitude, longitude, expires_at;
