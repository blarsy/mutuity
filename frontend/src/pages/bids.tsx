import { useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { RESOURCE_BIDS_OVERVIEW_QUERY } from "../features/resources/resources.queries";
import type { ResourceBidStatus } from "../features/resources/types";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";
import { ResourceCard } from "../features/ui/ResourceCard";

type ResourceBidsOverviewData = {
  allResourceBids: {
    nodes: Array<{
      id: string;
      resourceId: string;
      bidderAccountId: string;
      message: string | null;
      proposedTokenAmount: number | null;
      status: ResourceBidStatus;
      createdAt: string;
      respondedAt: string | null;
      respondedByAccountId: string | null;
      accountByBidderAccountId: {
        id: string;
        displayName: string | null;
        externalSubject: string;
      } | null;
      resourceByResourceId: {
        id: string;
        creatorAccountId: string;
        title: string;
        description: string | null;
        location: string;
        defaultTokenAmount: number | null;
        categoryLabels: string[];
        isProduct: boolean;
        isService: boolean;
        canBeExchanged: boolean;
        expiresAt: string | null;
        createdAt: string;
        accountByCreatorAccountId: {
          id: string;
          displayName: string | null;
          externalSubject: string;
        } | null;
      };
    }>;
  };
};

function formatDate(value: string | null) {
  if (!value) {
    return "No review yet";
  }

  return new Date(value).toLocaleString();
}

function formatBidStatus(status: ResourceBidStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

function bidChipColor(status: ResourceBidStatus): "default" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "DECLINED":
      return "error";
    case "EXPIRED":
      return "warning";
    case "WITHDRAWN":
      return "default";
    default:
      return "info";
  }
}

export default function BidsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const { data, loading, error } = useQuery<ResourceBidsOverviewData>(RESOURCE_BIDS_OVERVIEW_QUERY, {
    pollInterval: isAuthenticated ? 15000 : 0,
    skip: !isAuthenticated,
    variables: { first: 100 }
  });

  const currentAccountId = session.account?.id ?? null;
  const currentAccountLabel = session.account?.displayName ?? session.account?.externalSubject ?? "You";
  const allBids = useMemo(() => {
    return [...(data?.allResourceBids.nodes ?? [])].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, [data?.allResourceBids.nodes]);
  const sentBids = allBids.filter(bid => bid.bidderAccountId === currentAccountId);
  const receivedBids = allBids.filter(bid => bid.resourceByResourceId.creatorAccountId === currentAccountId);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Bids
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session…" : isRedirecting ? "Redirecting to sign in…" : "Please sign in to continue."}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              Bids workspace
            </Typography>
            <Typography color="text.secondary">
              Track the bids you sent on other accounts’ resources and the incoming bids received on your own resources.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip color="info" label={`${sentBids.length} sent`} />
            <Chip color="secondary" label={`${receivedBids.length} received`} />
          </Stack>

          {loading ? <Alert severity="info">Loading your bids…</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack spacing={2}>
            <Typography variant="h5">Bids you sent</Typography>
            {sentBids.length === 0 ? (
              <Alert severity="info">You have not sent any resource bids yet.</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
                }}
              >
                {sentBids.map(bid => {
                  const resource = bid.resourceByResourceId;
                  const creatorLabel = resource.accountByCreatorAccountId?.displayName
                    ?? resource.accountByCreatorAccountId?.externalSubject
                    ?? resource.creatorAccountId;

                  return (
                    <ResourceCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button component={NextLink} href={`/resources/${resource.id}`} variant="outlined">
                            View resource
                          </Button>
                          <Button component={NextLink} href={`/accounts/${resource.creatorAccountId}`} variant="text">
                            View creator
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <Chip color={bidChipColor(bid.status)} label={formatBidStatus(bid.status)} size="small" />
                          <Chip label={`${bid.proposedTokenAmount ?? resource.defaultTokenAmount ?? "—"} tokens`} size="small" variant="outlined" />
                          {resource.canBeExchanged ? <Chip label="exchangeable" size="small" variant="outlined" /> : null}
                        </>
                      }
                      creatorName={creatorLabel}
                      description={resource.description}
                      expiresAt={resource.expiresAt}
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Sent: {formatDate(bid.createdAt)}
                            {bid.respondedAt ? ` • Reviewed: ${formatDate(bid.respondedAt)}` : ""}
                          </Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                            {bid.message?.trim() ? `Your note: ${bid.message}` : "No note added."}
                          </Typography>
                        </Stack>
                      }
                      key={bid.id}
                      location={resource.location}
                      onClick={() => {
                        void router.push(`/resources/${resource.id}`);
                      }}
                      onCreatorClick={() => {
                        void router.push(`/accounts/${resource.creatorAccountId}`);
                      }}
                      title={resource.title}
                    />
                  );
                })}
              </Box>
            )}
          </Stack>

          <Stack spacing={2}>
            <Typography variant="h5">Bids received on your resources</Typography>
            {receivedBids.length === 0 ? (
              <Alert severity="info">No one has responded to your resources yet.</Alert>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))"
                }}
              >
                {receivedBids.map(bid => {
                  const resource = bid.resourceByResourceId;
                  const bidderLabel = bid.accountByBidderAccountId?.displayName
                    ?? bid.accountByBidderAccountId?.externalSubject
                    ?? bid.bidderAccountId;

                  return (
                    <ResourceCard
                      actions={
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <Button component={NextLink} href={`/resources/${resource.id}`} variant="contained">
                            Review on resource page
                          </Button>
                          <Button component={NextLink} href={`/accounts/${bid.bidderAccountId}`} variant="text">
                            View bidder
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <Chip color={bidChipColor(bid.status)} label={formatBidStatus(bid.status)} size="small" />
                          <Chip label={`Bid from ${bidderLabel}`} size="small" variant="outlined" />
                          <Chip label={`${bid.proposedTokenAmount ?? resource.defaultTokenAmount ?? "—"} tokens`} size="small" variant="outlined" />
                        </>
                      }
                      creatorName={currentAccountLabel}
                      description={resource.description}
                      expiresAt={resource.expiresAt}
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            Received: {formatDate(bid.createdAt)}
                            {bid.respondedAt ? ` • Reviewed: ${formatDate(bid.respondedAt)}` : ""}
                          </Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                            {bid.message?.trim() ? `Bid note: ${bid.message}` : "No note added."}
                          </Typography>
                        </Stack>
                      }
                      key={bid.id}
                      location={resource.location}
                      onClick={() => {
                        void router.push(`/resources/${resource.id}`);
                      }}
                      onCreatorClick={() => {
                        void router.push(`/accounts/${currentAccountId}`);
                      }}
                      title={resource.title}
                    />
                  );
                })}
              </Box>
            )}
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
}
