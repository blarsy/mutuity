insert into app_public.account (external_subject, display_name)
values ($1, $2)
on conflict (external_subject) do update
set display_name = excluded.display_name,
    updated_at = now()
returning id;
