import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import type { PublicNeedDetailQuery, ResourceDetailQuery } from "../../graphql/generated";
import { PUBLIC_NEED_DETAIL_QUERY } from "../needs/needs.queries";
import { RESOURCE_DETAIL_QUERY } from "../resources/resources.queries";
import { NeedCard } from "../ui/NeedCard";
import { ResourceCard } from "../ui/ResourceCard";
import { centeredResponsiveListingCardGridSx } from "../ui/listingCardGrid";

// These public functions expose accepted links only. Their record connections do
// not support condition/filter or pageInfo in the checked-in schema, so request
// the complete unbounded connections and scope them locally before detail reads.
export const PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY = gql`
  query PublicCampaignJoinedLinks {
    publicCampaignNeedLinks { nodes { campaignId needId } }
    publicCampaignResourceLinks { nodes { campaignId resourceId } }
  }
`;

type Links = {
  publicCampaignNeedLinks: { nodes: { campaignId: string | null; needId: string | null }[] } | null;
  publicCampaignResourceLinks: { nodes: { campaignId: string | null; resourceId: string | null }[] } | null;
};
type Need = NonNullable<PublicNeedDetailQuery["needById"]>;
type Resource = NonNullable<ResourceDetailQuery["resourceById"]>;
type Listings = { needs: Need[]; resources: Resource[] };
type State = { campaignId: string; status: "loading" | "error" } | { campaignId: string; status: "ready"; listings: Listings };
const DETAIL_CONCURRENCY = 6;

function visible(listing: { isActive: boolean; expiresAt: string | null }): boolean {
  return listing.isActive && (!listing.expiresAt || new Date(listing.expiresAt).getTime() > Date.now());
}

export function PublicCampaignJoinedListings({ campaignId }: { campaignId: string }) {
  const client = useApolloClient();
  const router = useRouter();
  const { t } = useTranslation("campaigns");
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ campaignId, status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const context = { fetchOptions: { signal: controller.signal }, queryDeduplication: false };
    setState({ campaignId, status: "loading" });

    async function load() {
      try {
        const { data } = await client.query<Links>({ query: PUBLIC_CAMPAIGN_JOINED_LINKS_QUERY, fetchPolicy: "no-cache", context });
        if (cancelled) return;
        if (!data?.publicCampaignNeedLinks || !data.publicCampaignResourceLinks) throw new Error("Missing public campaign links");

        const needIds = [...new Set(data.publicCampaignNeedLinks.nodes.filter(link => link.campaignId === campaignId && link.needId).map(link => link.needId as string))];
        const resourceIds = [...new Set(data.publicCampaignResourceLinks.nodes.filter(link => link.campaignId === campaignId && link.resourceId).map(link => link.resourceId as string))];
        const jobs = [...needIds.map(id => ({ kind: "need" as const, id })), ...resourceIds.map(id => ({ kind: "resource" as const, id }))];
        const results: Array<Need | Resource | null> = Array(jobs.length).fill(null);
        let next = 0;
        async function worker() {
          while (!cancelled && next < jobs.length) {
            const index = next++;
            const job = jobs[index];
            if (job.kind === "need") {
              const { data: detail } = await client.query<PublicNeedDetailQuery>({ query: PUBLIC_NEED_DETAIL_QUERY, variables: { needId: job.id }, fetchPolicy: "no-cache", context });
              if (!detail) throw new Error("Missing need response");
              const item = detail.needById;
              if (item?.id === job.id && visible(item)) results[index] = item;
            } else {
              const { data: detail } = await client.query<ResourceDetailQuery>({ query: RESOURCE_DETAIL_QUERY, variables: { resourceId: job.id }, fetchPolicy: "no-cache", context });
              if (!detail) throw new Error("Missing resource response");
              const item = detail.resourceById;
              if (item?.id === job.id && visible(item)) results[index] = item;
            }
          }
        }
        await Promise.all(Array.from({ length: Math.min(DETAIL_CONCURRENCY, jobs.length) }, () => worker()));
        if (!cancelled) setState({ campaignId, status: "ready", listings: {
          needs: results.slice(0, needIds.length).filter((item): item is Need => item !== null),
          resources: results.slice(needIds.length).filter((item): item is Resource => item !== null)
        } });
      } catch {
        if (!cancelled) {
          // Stop other workers as well; do not start more detail requests on failure.
          cancelled = true;
          controller.abort();
          setState({ campaignId, status: "error" });
        }
      }
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [campaignId, client, attempt]);

  const current = state.campaignId === campaignId ? state : { campaignId, status: "loading" as const };
  const unknownCreator = t("public.joinedListings.unknownCreator", { defaultValue: "Unknown creator" });
  const imageUrls = (urls: Array<string | null> | null) => (urls ?? []).filter((url): url is string => Boolean(url));

  return (
    <Stack spacing={3}>
      {current.status === "loading" ? <Alert role="status" severity="info">{t("public.joinedListings.loading", { defaultValue: "Loading listings…" })}</Alert> : null}
      {current.status === "error" ? <Alert severity="error" action={<Button color="inherit" onClick={() => setAttempt(value => value + 1)}>{t("public.joinedListings.retry", { defaultValue: "Retry" })}</Button>}>
        {t("public.joinedListings.error", { defaultValue: "Could not load listings." })}
      </Alert> : null}
      {current.status === "ready" ? <>
        <Box component="section">
          <Typography component="h2" variant="h5" gutterBottom>{t("public.joinedListings.needsTitle", { defaultValue: "Accepted needs" })}</Typography>
          {current.listings.needs.length === 0 ? <Typography>{t("public.joinedListings.emptyNeeds", { defaultValue: "No accepted needs." })}</Typography> :
            <Box sx={centeredResponsiveListingCardGridSx}>{current.listings.needs.map(need => <NeedCard key={need.id} cardMaxWidth={400}
              title={need.title} creatorName={need.accountByCreatorAccountId?.displayName?.trim() || unknownCreator}
              description={need.description} expiresAt={need.expiresAt} imageUrls={imageUrls(need.imageUrls)} tokenAmount={need.proposedTopesAmount}
              onClick={() => void router.push(`/needs/${need.id}`)} onCreatorClick={() => void router.push(`/accounts/${need.creatorAccountId}`)} />)}</Box>}
        </Box>
        <Box component="section">
          <Typography component="h2" variant="h5" gutterBottom>{t("public.joinedListings.resourcesTitle", { defaultValue: "Accepted resources" })}</Typography>
          {current.listings.resources.length === 0 ? <Typography>{t("public.joinedListings.emptyResources", { defaultValue: "No accepted resources." })}</Typography> :
            <Box sx={centeredResponsiveListingCardGridSx}>{current.listings.resources.map(resource => <ResourceCard key={resource.id} cardMaxWidth={400}
              title={resource.title} creatorName={resource.accountByCreatorAccountId?.displayName?.trim() || unknownCreator}
              creatorImageUrl={resource.accountByCreatorAccountId?.avatarUrl} description={resource.description} location={resource.location}
              expiresAt={resource.expiresAt} imageUrls={imageUrls(resource.imageUrls)} tokenAmount={resource.defaultTokenAmount}
              onClick={() => void router.push(`/resources/${resource.id}`)} onCreatorClick={() => void router.push(`/accounts/${resource.creatorAccountId}`)} />)}</Box>}
        </Box>
      </> : null}
    </Stack>
  );
}