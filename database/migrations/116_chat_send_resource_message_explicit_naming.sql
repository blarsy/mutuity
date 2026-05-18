-- Resolve function overload naming conflict for send_resource_message.
--
-- Two SQL functions share the name send_resource_message:
-- 1. (resource_bid_id uuid, body text, image_urls text[]) - bid-based, has @name sendResourceMessage
-- 2. (p_resource_id uuid, p_other_account_id uuid, p_body text, p_image_urls text[]) - direct, no @name
--
-- PostGraphile infers GraphQL mutation names from smart comments; when overloaded
-- functions lack explicit names, PostGraphile may not expose all of them. This
-- migration ensures both functions have explicit names in their pg_description.

begin;

-- The bid-based variant should be named sendResourceMessage (already correct via smart comment in source)
-- The direct variant is already aliased via its migration but lacks an explicit @name comment.
-- We'll add an explicit comment to the direct variant to ensure PostGraphile sees both.

comment on function app_public.send_resource_message(
  p_resource_id uuid,
  p_other_account_id uuid,
  p_body text,
  p_image_urls text[]
) is '@name sendResourceMessageDirect';

-- Refresh the bid-based variant comment to ensure consistency
comment on function app_public.send_resource_message(
  resource_bid_id uuid,
  body text,
  image_urls text[]
) is '@name sendResourceMessage';

commit;
