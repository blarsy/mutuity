begin;

create or replace function app_private.normalize_account_profile_fields()
returns trigger
language plpgsql
as $$
begin
  new.display_name := nullif(btrim(coalesce(new.display_name, '')), '');
  new.bio := nullif(btrim(coalesce(new.bio, '')), '');
  new.location := nullif(btrim(coalesce(new.location, '')), '');
  new.avatar_url := nullif(btrim(coalesce(new.avatar_url, '')), '');
  new.profile_links := app_private.normalize_profile_links(coalesce(new.profile_links, '[]'::jsonb));
  return new;
end;
$$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'app_public'
      and table_name = 'account'
      and column_name = 'external_link_url'
  ) then
    execute $sql$
      update app_public.account
      set profile_links = app_private.normalize_profile_links(
        case
          when coalesce(profile_links, '[]'::jsonb) <> '[]'::jsonb then profile_links
          when nullif(btrim(coalesce(external_link_url, '')), '') is not null then jsonb_build_array(
            jsonb_build_object(
              'url', btrim(external_link_url),
              'label', 'Website',
              'type', 'website'
            )
          )
          else '[]'::jsonb
        end
      )
    $sql$;

    alter table app_public.account
      drop column external_link_url;
  end if;
end;
$$;

commit;
