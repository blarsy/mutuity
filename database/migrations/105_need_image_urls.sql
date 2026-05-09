begin;

alter table app_public.need
  add column if not exists image_urls text[] default array[]::text[];

update app_public.need
set image_urls = array[]::text[]
where image_urls is null;

alter table app_public.need
  alter column image_urls set default array[]::text[];

-- Replace legacy create_need signature so GraphQL keeps a single createNeed entrypoint.
drop function if exists app_public.create_need(
  text,
  text,
  text,
  app_public.need_intensity,
  integer,
  boolean,
  boolean,
  boolean,
  boolean,
  text,
  text,
  integer,
  uuid,
  numeric,
  numeric,
  timestamptz
);

drop function if exists app_public.search_needs(
  numeric,
  numeric,
  numeric,
  numeric,
  text,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  app_public.tri_state_filter,
  integer
);

\ir ../functions/need/create_need.sql
\ir ../functions/need/search_needs.sql

commit;
