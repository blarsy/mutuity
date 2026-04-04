update app_public.account
set latitude = $2,
    longitude = $3,
    updated_at = now()
where id = $1;
