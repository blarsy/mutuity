-- Backfill accounts that were created before migration 044 added the
-- preferred_language NOT NULL DEFAULT 'en' constraint.
-- Those rows remained NULL because ALTER TABLE ... ADD COLUMN ... DEFAULT
-- only sets the default for new rows, not existing ones with explicit NULLs
-- stored before the column existed.

update app_public.account
set preferred_language = 'en'
where preferred_language is null;
