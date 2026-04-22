import { useMemo } from "react";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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

function formatDate(value: string | null, noDateLabel: string) {
  if (!value) {
    return noDateLabel;
  }

  return new Date(value).toLocaleString();
}

function formatBidStatus(status: ResourceBidStatus, t: (key: string, options?: Record<string, unknown>) => string) {
  return t(`statuses.${status}`, { defaultValue: status.replaceAll("_", " ").toLowerCase() });
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
  const { t } = useTranslation("bids");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const { data, loading, error } = useQuery<ResourceBidsOverviewData>(RESOURCE_BIDS_OVERVIEW_QUERY, {
    pollInterval: isAuthenticated ? 15000 : 0,
    skip: !isAuthenticated,
    variables: { first: 100 }
  });

  const currentAccountId = session.account?.id ?? null;
  const currentAccountLabel = session.account?.displayName ?? session.account?.externalSubject ?? t("you");
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
            {t("title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
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
              {t("workspaceTitle")}
            </Typography>
            <Typography color="text.secondary">
              {t("workspaceSubtitle")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip color="info" label={t("sentCount", { count: sentBids.length })} />
            <Chip color="secondary" label={t("receivedCount", { count: receivedBids.length })} />
          </Stack>

          {loading ? <Alert severity="info">{t("loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack spacing={2}>
            <Typography variant="h5">{t("sections.sent")}</Typography>
            {sentBids.length === 0 ? (
              <Alert severity="info">{t("sentEmpty")}</Alert>
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
                            {t("actions.viewResource")}
                          </Button>
                          <Button component={NextLink} href={`/accounts/${resource.creatorAccountId}`} variant="text">
                            {t("actions.viewCreator")}
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <Chip color={bidChipColor(bid.status)} label={formatBidStatus(bid.status, t)} size="small" />
                          <Chip label={t("chips.tokens", { value: bid.proposedTokenAmount ?? resource.defaultTokenAmount ?? "—" })} size="small" variant="outlined" />
                          {resource.canBeExchanged ? <Chip label={t("chips.exchangeable")} size="small" variant="outlined" /> : null}
                        </>
                      }
                      creatorName={creatorLabel}
                      description={resource.description}
                      expiresAt={resource.expiresAt}
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            {t("sentAt", { date: formatDate(bid.createdAt, t("noReviewYet")) })}
                            {bid.respondedAt ? ` • ${t("reviewedAt", { date: formatDate(bid.respondedAt, t("noReviewYet")) })}` : ""}
                          </Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                            {bid.message?.trim() ? t("yourNote", { message: bid.message }) : t("noNote")}
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
            <Typography variant="h5">{t("sections.received")}</Typography>
            {receivedBids.length === 0 ? (
              <Alert severity="info">{t("receivedEmpty")}</Alert>
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
                            {t("actions.reviewOnResource")}
                          </Button>
                          <Button component={NextLink} href={`/accounts/${bid.bidderAccountId}`} variant="text">
                            {t("actions.viewBidder")}
                          </Button>
                        </Stack>
                      }
                      chips={
                        <>
                          <Chip color={bidChipColor(bid.status)} label={formatBidStatus(bid.status, t)} size="small" />
                          <Chip label={t("bidFrom", { bidder: bidderLabel })} size="small" variant="outlined" />
                          <Chip label={t("chips.tokens", { value: bid.proposedTokenAmount ?? resource.defaultTokenAmount ?? "—" })} size="small" variant="outlined" />
                        </>
                      }
                      creatorName={currentAccountLabel}
                      description={resource.description}
                      expiresAt={resource.expiresAt}
                      footer={
                        <Stack spacing={0.5}>
                          <Typography color="text.secondary" variant="body2">
                            {t("receivedAt", { date: formatDate(bid.createdAt, t("noReviewYet")) })}
                            {bid.respondedAt ? ` • ${t("reviewedAt", { date: formatDate(bid.respondedAt, t("noReviewYet")) })}` : ""}
                          </Typography>
                          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                            {bid.message?.trim() ? t("bidNote", { message: bid.message }) : t("noNote")}
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
