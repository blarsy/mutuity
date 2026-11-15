-- Enum additions must commit before the value is used by migration 166.
alter type app_public.campaign_need_status add value if not exists 'superseded';