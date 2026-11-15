-- PostGraphile exposes equality conditions only for indexed columns.
create index campaign_need_is_current_idx on app_public.campaign_need(is_current);
create index campaign_resource_is_current_idx on app_public.campaign_resource(is_current);