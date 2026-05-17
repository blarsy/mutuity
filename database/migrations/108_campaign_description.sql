begin;

alter table app_public.campaign
  add column if not exists description text;

drop function if exists app_public.create_campaign(
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
);

drop function if exists app_public.create_campaign(
  text,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
);

drop function if exists app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
);

drop function if exists app_public.update_campaign_for_moderation(
  uuid,
  text,
  text,
  text,
  text,
  integer,
  integer,
  timestamptz,
  timestamptz,
  timestamptz,
  text
);

\ir ../functions/campaign/create_campaign.sql
\ir ../functions/campaign/update_campaign_for_moderation.sql

commit;
