begin;

create extension if not exists pg_trgm;

create or replace function app_private.immutable_unaccent(p_text text)
returns text
language sql
immutable
parallel safe
as $$
  select public.unaccent('public.unaccent', coalesce(p_text, ''))
$$;

create or replace function app_private.account_search_document(
  p_display_name text,
  p_external_subject text
)
returns text
language sql
immutable
parallel safe
as $$
  select lower(
    app_private.immutable_unaccent(
      trim(concat_ws(' ', coalesce(p_display_name, ''), coalesce(p_external_subject, '')))
    )
  )
$$;

create or replace function app_private.need_search_document(
  p_title text,
  p_description text,
  p_required_tooling_text text,
  p_required_competence_text text
)
returns text
language sql
immutable
parallel safe
as $$
  select lower(
    app_private.immutable_unaccent(
      trim(
        concat_ws(
          ' ',
          coalesce(p_title, ''),
          coalesce(p_description, ''),
          coalesce(p_required_tooling_text, ''),
          coalesce(p_required_competence_text, '')
        )
      )
    )
  )
$$;

create index if not exists need_search_active_expiry_idx
  on app_public.need (is_active, expires_at, created_at desc);

create index if not exists need_search_flag_window_idx
  on app_public.need (
    multiple_people_required,
    tooling_required,
    competence_required,
    object_required,
    expires_at
  )
  where is_active = true;

create index if not exists need_search_text_trgm_idx
  on app_public.need
  using gin (
    app_private.need_search_document(
      title,
      description,
      required_tooling_text,
      required_competence_text
    ) gin_trgm_ops
  );

create index if not exists account_search_identity_trgm_idx
  on app_public.account
  using gin (
    app_private.account_search_document(display_name, external_subject) gin_trgm_ops
  );

comment on index app_public.need_search_active_expiry_idx is
  'Supports Phase 8 public need discovery by narrowing active/non-expired needs before ranking.';

comment on index app_public.need_search_text_trgm_idx is
  'Supports accent-insensitive partial text search across need title/description/tooling/competence text.';

comment on index app_public.account_search_identity_trgm_idx is
  'Supports accent-insensitive partial text search across creator display name and external subject.';

commit;
