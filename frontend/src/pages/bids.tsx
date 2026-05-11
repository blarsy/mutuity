import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import {
  CANCEL_RESOURCE_BID_MUTATION,
  RECEIVED_BIDS_QUERY,
  RESPOND_TO_RESOURCE_BID_MUTATION,
  SENT_BIDS_QUERY
} from "../features/resources/resources.queries";
import type { ResourceBidStatus } from "../features/resources/types";
import { useAccountEventSignal } from "../services/graphql/accountEvents";
import { conversationThreadUrl } from "../features/chat/chatRouting";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";
import { ListingHeader } from "../features/ui/ListingHeader";

const PAGE_SIZE = 5;

type BidNode = {
  id: string;
  resourceId: string;
  bidderAccountId: string;
  message: string | null;
  proposedTokenAmount: number | null;
  status: ResourceBidStatus;
  isActive: boolean;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  respondedByAccountId: string | null;
  resourceConversationsByResourceBidId: { nodes: Array<{ id: string }> };
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
    imageUrls: string[];
    categoryLabels: string[];
    isProduct: boolean;
    isService: boolean;
    canBeExchanged: boolean;
    isActive: boolean;
    expiresAt: string | null;
    accountByCreatorAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
  };
};

type BidQueryData = {
  nodes: BidNode[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  totalCount: number;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function bidChipColor(status: ResourceBidStatus): "default" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case "ACCEPTED": return "success";
    case "DECLINED": return "error";
    case "EXPIRED": return "warning";
    case "WITHDRAWN": return "default";
    default: return "info";
  }
}

function InactiveExplanation({ bid, t }: { bid: BidNode; t: (k: string, opts?: Record<string, unknown>) => string }) {
  const { status } = bid;
  const key = status.toLowerCase() as "accepted" | "declined" | "withdrawn" | "expired";
  const decisionDate =
    status === "WITHDRAWN"
      ? bid.updatedAt
      : bid.respondedAt ?? bid.updatedAt;
  const severity = status === "ACCEPTED" ? "success" : status === "DECLINED" ? "error" : "warning";
  return <Alert severity={severity} sx={{ py: 0.5 }}>{t(`inactive.${key}`, { date: formatDate(decisionDate) })}</Alert>;
}

function BidCard({
  bid,
  counterpartyLabel,
  counterpartyHref,
  actions,
  highlighted = false,
  t
}: {
  bid: BidNode;
  counterpartyLabel: string;
  counterpartyHref: string;
  actions: React.ReactNode;
  highlighted?: boolean;
  t: (k: string, opts?: Record<string, unknown>) => string;
}) {
  const resource = bid.resourceByResourceId;
  const tokenAmount = bid.proposedTokenAmount ?? resource.defaultTokenAmount;

  return (
    <Box
      id={`bid-${bid.id}`}
      sx={{
        border: 1,
        borderColor: highlighted ? "primary.main" : "divider",
        borderRadius: 2,
        boxShadow: highlighted ? theme => `0 0 0 2px ${theme.palette.primary.light}` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 2
      }}
    >
      <ListingHeader
        creatorName={counterpartyLabel}
        expiresAt={bid.validUntil}
        expiresLabel="Valid until"
        listingTitle={resource.title}
        noDateLabel="No date"
        noImageLabel="No image"
        onCreatorClick={undefined}
        thumbnailAlt={resource.title}
        thumbnailUrl={resource.imageUrls?.[0] ?? null}
      />

      <Stack alignItems="flex-start" direction="row" justifyContent="space-between" spacing={1}>
        <Chip color={bidChipColor(bid.status)} label={t(`statuses.${bid.status}`)} size="small" />
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        <Chip clickable component={NextLink} href={counterpartyHref} label={counterpartyLabel} size="small" variant="outlined" />
        {tokenAmount != null ? (
          <Chip label={t("chips.tokens", { value: tokenAmount })} size="small" variant="outlined" />
        ) : null}
        {tokenAmount != null && bid.isActive ? (
          <Chip color="warning" label={t("reserved", { value: tokenAmount })} size="small" variant="outlined" />
        ) : null}
        {resource.canBeExchanged ? <Chip label={t("chips.exchangeable")} size="small" variant="outlined" /> : null}
      </Stack>

      <Typography color="text.secondary" variant="body2">
        {t("sentAt", { date: formatDate(bid.createdAt) })}
        {bid.respondedAt ? ` · ${t("reviewedAt", { date: formatDate(bid.respondedAt) })}` : ""}
        {bid.isActive ? ` · ${t("validity", { date: formatDate(bid.validUntil) })}` : ""}
      </Typography>

      {bid.message ? (
        <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">
          {t("yourNote", { message: bid.message })}
        </Typography>
      ) : null}

      {!bid.isActive ? <InactiveExplanation bid={bid} t={t} /> : null}

      {actions}
    </Box>
  );
}

function BidSection({
  title,
  bids,
  hasNextPage,
  loading,
  errorMessage,
  activeOnly,
  emptyKey,
  onToggleActiveOnly,
  onLoadMore,
  renderBidCard
}: {
  title: string;
  bids: BidNode[];
  hasNextPage: boolean;
  loading: boolean;
  errorMessage: string | null;
  activeOnly: boolean;
  emptyKey: string;
  onToggleActiveOnly: (v: boolean) => void;
  onLoadMore: () => void;
  renderBidCard: (bid: BidNode) => React.ReactNode;
}) {
  const { t } = useTranslation("bids");

  return (
    <Stack spacing={2}>
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
        <Typography variant="h5">{title}</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={activeOnly ? "active" : "all"}
          onChange={(_, v) => { if (v !== null) onToggleActiveOnly(v === "active"); }}
        >
          <ToggleButton value="all">{t("filters.all")}</ToggleButton>
          <ToggleButton value="active">{t("filters.activeOnly")}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      {loading && bids.length === 0 ? (
        <Stack spacing={1}>
          <Skeleton height={160} variant="rounded" />
          <Skeleton height={160} variant="rounded" />
        </Stack>
      ) : bids.length === 0 ? (
        <Alert severity="info">{t(emptyKey)}</Alert>
      ) : (
        <Stack spacing={2}>
          {bids.map(bid => renderBidCard(bid))}
          {hasNextPage ? (
            <Button disabled={loading} onClick={onLoadMore} variant="outlined">
              {t("actions.loadMore")}
            </Button>
          ) : null}
        </Stack>
      )}
    </Stack>
  );
}

export default function BidsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("bids");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const isAdmin = isAuthenticated && session.role === "admin";

  const [sentActiveOnly, setSentActiveOnly] = useState(false);
  const [receivedActiveOnly, setReceivedActiveOnly] = useState(false);
  const [acceptConfirmBidId, setAcceptConfirmBidId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const currentAccountLabel = session.account?.displayName ?? session.account?.externalSubject ?? t("you");
  const highlightedBidId = typeof router.query.bidId === "string" ? router.query.bidId : null;

  const {
    data: sentData,
    loading: sentLoading,
    error: sentError,
    fetchMore: sentFetchMore,
    refetch: refetchSentBids
  } = useQuery<{ sentResourceBids: BidQueryData }>(SENT_BIDS_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !isAuthenticated || isAdmin,
    variables: { activeOnly: sentActiveOnly, first: PAGE_SIZE, after: null }
  });

  const {
    data: receivedData,
    loading: receivedLoading,
    error: receivedError,
    fetchMore: receivedFetchMore,
    refetch: refetchReceivedBids
  } = useQuery<{ receivedResourceBids: BidQueryData }>(RECEIVED_BIDS_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !isAuthenticated || isAdmin,
    variables: { activeOnly: receivedActiveOnly, first: PAGE_SIZE, after: null }
  });

  const [cancelBid] = useMutation(CANCEL_RESOURCE_BID_MUTATION, {
    onError: err => { setActionError(getUserFacingGraphQLErrorMessage(err)); },
    refetchQueries: [
      { query: SENT_BIDS_QUERY, variables: { activeOnly: sentActiveOnly, first: PAGE_SIZE, after: null } }
    ]
  });

  const [respondBid] = useMutation(RESPOND_TO_RESOURCE_BID_MUTATION, {
    onError: err => { setActionError(getUserFacingGraphQLErrorMessage(err)); },
    refetchQueries: [
      { query: RECEIVED_BIDS_QUERY, variables: { activeOnly: receivedActiveOnly, first: PAGE_SIZE, after: null } }
    ]
  });

  const handleBidWorkspaceSignal = useCallback(() => {
    void refetchSentBids({ activeOnly: sentActiveOnly, first: PAGE_SIZE, after: null });
    void refetchReceivedBids({ activeOnly: receivedActiveOnly, first: PAGE_SIZE, after: null });
  }, [receivedActiveOnly, refetchReceivedBids, refetchSentBids, sentActiveOnly]);

  useAccountEventSignal(handleBidWorkspaceSignal, isAuthenticated && !isAdmin);

  const sentBids = sentData?.sentResourceBids.nodes ?? [];
  const receivedBids = receivedData?.receivedResourceBids.nodes ?? [];
  const sentHasMore = sentData?.sentResourceBids.pageInfo.hasNextPage ?? false;
  const receivedHasMore = receivedData?.receivedResourceBids.pageInfo.hasNextPage ?? false;

  useEffect(() => {
    if (!highlightedBidId) {
      return;
    }

    const element = document.getElementById(`bid-${highlightedBidId}`);
    if (!element) {
      return;
    }

    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedBidId, receivedBids.length, sentBids.length]);

  const handleLoadMoreSent = () => {
    void sentFetchMore({
      variables: { after: sentData?.sentResourceBids.pageInfo.endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          sentResourceBids: {
            ...fetchMoreResult.sentResourceBids,
            nodes: [...prev.sentResourceBids.nodes, ...fetchMoreResult.sentResourceBids.nodes]
          }
        };
      }
    });
  };

  const handleLoadMoreReceived = () => {
    void receivedFetchMore({
      variables: { after: receivedData?.receivedResourceBids.pageInfo.endCursor },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          receivedResourceBids: {
            ...fetchMoreResult.receivedResourceBids,
            nodes: [...prev.receivedResourceBids.nodes, ...fetchMoreResult.receivedResourceBids.nodes]
          }
        };
      }
    });
  };

  const handleCancel = (bidId: string) => {
    setActionError(null);
    void cancelBid({ variables: { input: { resourceBidId: bidId } } });
  };

  const handleAcceptConfirm = () => {
    if (!acceptConfirmBidId) return;
    setActionError(null);
    void respondBid({ variables: { input: { resourceBidId: acceptConfirmBidId, status: "ACCEPTED" } } });
    setAcceptConfirmBidId(null);
  };

  const handleDecline = (bidId: string) => {
    setActionError(null);
    void respondBid({ variables: { input: { resourceBidId: bidId, status: "DECLINED" } } });
  };

  const renderSentBidCard = (bid: BidNode) => {
    const resource = bid.resourceByResourceId;
    const creatorLabel =
      resource.accountByCreatorAccountId?.displayName ??
      resource.accountByCreatorAccountId?.externalSubject ??
      resource.creatorAccountId;

    return (
      <BidCard
        key={bid.id}
        actions={
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button component={NextLink} href={`/resources/${resource.id}`} size="small" variant="outlined">
              {t("actions.viewResource")}
            </Button>
            <Button component={NextLink} href={`/accounts/${resource.creatorAccountId}`} size="small" variant="text">
              {t("actions.viewCreator")}
            </Button>
            {bid.resourceConversationsByResourceBidId.nodes[0]?.id ? (
              <Button
                component={NextLink}
                href={conversationThreadUrl("resource", bid.resourceConversationsByResourceBidId.nodes[0].id)}
                size="small"
                variant="text"
              >
                {t("actions.chat")}
              </Button>
            ) : null}
            {bid.isActive ? (
              <Button color="error" onClick={() => { handleCancel(bid.id); }} size="small" variant="outlined">
                {t("actions.cancel")}
              </Button>
            ) : null}
          </Stack>
        }
        bid={bid}
        counterpartyHref={`/accounts/${resource.creatorAccountId}`}
        counterpartyLabel={creatorLabel}
        highlighted={highlightedBidId === bid.id}
        t={t}
      />
    );
  };

  const renderReceivedBidCard = (bid: BidNode) => {
    const bidderLabel =
      bid.accountByBidderAccountId?.displayName ??
      bid.accountByBidderAccountId?.externalSubject ??
      bid.bidderAccountId;

    return (
      <BidCard
        key={bid.id}
        actions={
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button component={NextLink} href={`/resources/${bid.resourceByResourceId.id}`} size="small" variant="outlined">
              {t("actions.viewResource")}
            </Button>
            <Button component={NextLink} href={`/accounts/${bid.bidderAccountId}`} size="small" variant="text">
              {t("actions.viewBidder")}
            </Button>
            {bid.resourceConversationsByResourceBidId.nodes[0]?.id ? (
              <Button
                component={NextLink}
                href={conversationThreadUrl("resource", bid.resourceConversationsByResourceBidId.nodes[0].id)}
                size="small"
                variant="text"
              >
                {t("actions.chat")}
              </Button>
            ) : null}
            {bid.isActive ? (
              <>
                <Button color="success" onClick={() => { setAcceptConfirmBidId(bid.id); }} size="small" variant="contained">
                  {t("actions.accept")}
                </Button>
                <Button color="error" onClick={() => { handleDecline(bid.id); }} size="small" variant="outlined">
                  {t("actions.decline")}
                </Button>
              </>
            ) : null}
          </Stack>
        }
        bid={bid}
        counterpartyHref={`/accounts/${bid.bidderAccountId}`}
        counterpartyLabel={bidderLabel}
        highlighted={highlightedBidId === bid.id}
        t={t}
      />
    );
  };

  if (isChecking || isRedirecting) return null;

  if (isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <Typography variant="h4">{t("workspaceTitle")}</Typography>
          <Alert severity="info">
            This workspace is only available for regular accounts. Admin actions are available from the admin console.
          </Alert>
          <Box>
            <Button component={NextLink} href="/admin" variant="contained">
              Open admin console
            </Button>
          </Box>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4">{t("workspaceTitle")}</Typography>
          <Typography color="text.secondary" variant="body2">{t("workspaceSubtitle")}</Typography>
        </Box>

        {actionError ? <Alert onClose={() => { setActionError(null); }} severity="error">{actionError}</Alert> : null}

        <Box sx={{ display: "grid", gap: 4, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <BidSection
            activeOnly={sentActiveOnly}
            bids={sentBids}
            emptyKey="sentEmpty"
            errorMessage={sentError ? getUserFacingGraphQLErrorMessage(sentError) : null}
            hasNextPage={sentHasMore}
            loading={sentLoading}
            onLoadMore={handleLoadMoreSent}
            onToggleActiveOnly={setSentActiveOnly}
            renderBidCard={renderSentBidCard}
            title={t("sections.sent")}
          />

          <BidSection
            activeOnly={receivedActiveOnly}
            bids={receivedBids}
            emptyKey="receivedEmpty"
            errorMessage={receivedError ? getUserFacingGraphQLErrorMessage(receivedError) : null}
            hasNextPage={receivedHasMore}
            loading={receivedLoading}
            onLoadMore={handleLoadMoreReceived}
            onToggleActiveOnly={setReceivedActiveOnly}
            renderBidCard={renderReceivedBidCard}
            title={t("sections.received")}
          />
        </Box>
      </Stack>

      <Dialog maxWidth="xs" open={acceptConfirmBidId !== null} onClose={() => { setAcceptConfirmBidId(null); }}>
        <DialogTitle>{t("acceptConfirm.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("acceptConfirm.message")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAcceptConfirmBidId(null); }}>{t("acceptConfirm.cancel")}</Button>
          <Button color="success" onClick={handleAcceptConfirm} variant="contained">{t("acceptConfirm.confirm")}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
