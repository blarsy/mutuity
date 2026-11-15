-- Enable indexed status-filtered connection counts in the campaign stats API.
create index if not exists campaign_resource_status_idx on app_public.campaign_resource(status);
create index if not exists campaign_need_status_idx on app_public.campaign_need(status);