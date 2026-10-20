insert into app_public.account (external_subject, display_name, preferred_language)
values ($1, $2, 'en')
on conflict (external_subject) do update
set display_name = excluded.display_name,
    preferred_language = excluded.preferred_language,
    updated_at = now()
returning id;
