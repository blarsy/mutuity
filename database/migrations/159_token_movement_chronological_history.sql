begin;

-- PostGraphile only exposes timestamp orderBy values for indexed columns.
-- The existing (account_id, created_at) index supports scoped history reads,
-- but does not expose CREATED_AT_DESC on the token movement connection.
create index if not exists token_movement_created_at_idx
  on app_public.token_movement (created_at);

commit;