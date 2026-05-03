begin;

-- Drop old 3-parameter create_resource_bid overload (replaced by 4-parameter version in 084)
-- This removes the ambiguous overload so PostGraphile exposes a single named mutation.
drop function if exists app_public.create_resource_bid(uuid, text, integer);

commit;
