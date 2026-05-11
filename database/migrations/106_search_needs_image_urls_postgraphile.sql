begin;

-- Create a named composite type for search_needs results to ensure PostGraphile properly exposes all columns
drop type if exists app_public.search_need_result cascade;

create type app_public.search_need_result as (
	id uuid,
	creator_account_id uuid,
	creator_display_name text,
	title text,
	description text,
	image_urls text[],
	location text,
	latitude numeric,
	longitude numeric,
	intensity app_public.need_intensity,
	proposed_topes_amount integer,
	object_required boolean,
	competence_required boolean,
	tooling_required boolean,
	multiple_people_required boolean,
	required_competence_text text,
	required_tooling_text text,
	required_people_count integer,
	is_active boolean,
	expires_at timestamptz,
	created_at timestamptz,
	updated_at timestamptz,
	closeness_score numeric,
	ease_of_setup_score numeric,
	expiration_score numeric,
	weighted_score numeric,
	query_latitude numeric,
	query_longitude numeric
);

comment on type app_public.search_need_result is '@name SearchNeedResult';
comment on column app_public.search_need_result.image_urls is 'URLs of images for this need';

-- Re-create search_needs function to return the named type
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

\ir ../functions/need/search_needs.sql

commit;
