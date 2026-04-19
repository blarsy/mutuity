import { useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import { useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Stack,
  Typography
} from "@mui/material";

import { useAuth } from "../auth/AuthProvider";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { INSPIRATION_CAMPAIGNS_QUERY, MY_CAMPAIGNS_CONNECTION_QUERY } from "./campaigns.queries";

type CampaignNode = {
  id: string;
  title: string;
  theme: string;
  moderationStatus: string;
  startAt: string;
  airdropAt: string;
  endAt: string;
  createdAt: string;
};

type MyCampaignsData = {
  allCampaigns: {
    nodes: CampaignNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
};

type MyCampaignsVariables = {
  creatorAccountId: string;
  first: number;
  after?: string;
};

type InspirationCampaignsData = {
  allCampaigns: {
    nodes: CampaignNode[];
  };
};

const PAGE_SIZE = 10;

function isCampaignActive(now: Date, startAtIso: string, endAtIso: string) {
  const startAt = new Date(startAtIso);
  const endAt = new Date(endAtIso);

  return now >= startAt && now <= endAt;
}

function isCampaignEnded(now: Date, endAtIso: string) {
  return now > new Date(endAtIso);
}

type CampaignCardsProps = {
  campaigns: CampaignNode[];
  grayEnded: boolean;
};

function CampaignCards({ campaigns, grayEnded }: CampaignCardsProps) {
  const now = new Date();

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      {campaigns.map(campaign => {
        const ended = isCampaignEnded(now, campaign.endAt);

        return (
          <Grid item key={campaign.id} xs={12}>
            <Card
              sx={grayEnded && ended ? { opacity: 0.55 } : undefined}
              variant="outlined"
            >
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="h6">{campaign.title}</Typography>
                    <Typography color="text.secondary">Theme: {campaign.theme}</Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Chip
                      color={isCampaignActive(now, campaign.startAt, campaign.endAt) ? "success" : "default"}
                      label={isCampaignActive(now, campaign.startAt, campaign.endAt) ? "Active" : ended ? "Ended" : "Upcoming"}
                      size="small"
                    />
                    <Chip label={campaign.moderationStatus} size="small" variant="outlined" />
                  </Stack>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ mt: 2 }}>
                  <Typography variant="body2">Created: {new Date(campaign.createdAt).toLocaleString()}</Typography>
                  <Typography variant="body2">Start: {new Date(campaign.startAt).toLocaleString()}</Typography>
                  <Typography variant="body2">Airdrop: {new Date(campaign.airdropAt).toLocaleString()}</Typography>
                  <Typography variant="body2">End: {new Date(campaign.endAt).toLocaleString()}</Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default function CampaignsPage() {
  const { session, status } = useAuth();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [isInspirationOpen, setIsInspirationOpen] = useState(false);

  const createCampaignHref = session.authenticated
    ? "/campaigns/create"
    : "/login?next=%2Fcampaigns%2Fcreate";

  const {
    data,
    loading,
    error,
    fetchMore
  } = useQuery<MyCampaignsData, MyCampaignsVariables>(MY_CAMPAIGNS_CONNECTION_QUERY, {
    skip: !session.authenticated || !session.account?.id,
    variables: {
      creatorAccountId: session.account?.id ?? "",
      first: PAGE_SIZE
    }
  });

  const {
    data: inspirationData,
    loading: inspirationLoading,
    error: inspirationError
  } = useQuery<InspirationCampaignsData>(INSPIRATION_CAMPAIGNS_QUERY);

  const myCampaigns = data?.allCampaigns.nodes ?? [];
  const hasNextPage = data?.allCampaigns.pageInfo.hasNextPage ?? false;
  const endCursor = data?.allCampaigns.pageInfo.endCursor ?? null;

  useEffect(() => {
    if (!loadMoreRef.current || !session.authenticated) {
      return;
    }

    const observer = new IntersectionObserver(entries => {
      const [entry] = entries;

      if (!entry?.isIntersecting || loading || !hasNextPage || !endCursor || !session.account?.id) {
        return;
      }

      void fetchMore({
        variables: {
          creatorAccountId: session.account.id,
          first: PAGE_SIZE,
          after: endCursor
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) {
            return previousResult;
          }

          return {
            allCampaigns: {
              ...fetchMoreResult.allCampaigns,
              nodes: [...previousResult.allCampaigns.nodes, ...fetchMoreResult.allCampaigns.nodes]
            }
          };
        }
      });
    });

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [endCursor, fetchMore, hasNextPage, loading, session.account?.id, session.authenticated]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error);
  const inspirationErrorMessage = getUserFacingGraphQLErrorMessage(inspirationError);

  const inspirationCampaigns = useMemo(() => {
    const now = new Date();
    const nodes = inspirationData?.allCampaigns.nodes ?? [];

    const active = nodes.filter(node => isCampaignActive(now, node.startAt, node.endAt));
    const inactive = nodes.filter(node => !isCampaignActive(now, node.startAt, node.endAt));

    return [...active, ...inactive].slice(0, 10);
  }, [inspirationData?.allCampaigns.nodes]);

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          Campaigns
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
          <Button component={NextLink} href="/" variant="outlined">
            Back home
          </Button>
          <Button component={NextLink} href={createCampaignHref} variant="contained">
            Launch campaign
          </Button>
        </Stack>

        <Link
          component="button"
          onClick={() => setIsInspirationOpen(true)}
          sx={{ mb: 3 }}
          type="button"
          underline="hover"
        >
          See others for inspiration
        </Link>

        {status === "loading" ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Checking your session…
          </Alert>
        ) : null}

        {!session.authenticated ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Sign in to see your campaigns and launch new ones.
          </Alert>
        ) : null}

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {session.authenticated ? (
          <>
            {loading ? <Alert severity="info">Loading your campaigns…</Alert> : null}

            {!loading && !errorMessage && myCampaigns.length === 0 ? (
              <Alert severity="info">You have not created any campaigns yet.</Alert>
            ) : null}

            <CampaignCards campaigns={myCampaigns} grayEnded />

            {hasNextPage ? (
              <Box ref={loadMoreRef} sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Chip label="Loading more…" size="small" variant="outlined" />
              </Box>
            ) : null}
          </>
        ) : null}

        <Dialog fullWidth maxWidth="lg" onClose={() => setIsInspirationOpen(false)} open={isInspirationOpen}>
          <DialogTitle>Approved campaigns for inspiration</DialogTitle>
          <DialogContent>
            {inspirationLoading ? <Alert severity="info">Loading campaigns…</Alert> : null}
            {inspirationErrorMessage ? <Alert severity="error">{inspirationErrorMessage}</Alert> : null}
            {!inspirationLoading && !inspirationErrorMessage && inspirationCampaigns.length === 0 ? (
              <Alert severity="info">No approved campaigns available yet.</Alert>
            ) : null}
            <CampaignCards campaigns={inspirationCampaigns} grayEnded={false} />
          </DialogContent>
        </Dialog>
      </Box>
    </Container>
  );
}
