-- Add indexes for foreign keys that PostGraphile requires for enabling 'read'
-- permission on the corresponding constraints.

CREATE INDEX ON "app_public"."resource_message"("sender_account_id");
CREATE INDEX ON "app_public"."claim_conversation"("need_claim_id");
CREATE INDEX ON "app_public"."resource_conversation"("resource_bid_id");
