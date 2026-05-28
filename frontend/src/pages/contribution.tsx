import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import NextLink from "next/link";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  useMediaQuery,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";

import { useAuth } from "../features/auth/AuthProvider";
import { useRequireAuth } from "../features/auth/requireAuth";
import { CONTRIBUTION_OVERVIEW_QUERY, GIFT_TOKENS_MUTATION } from "../features/contribution/contribution.queries";
import { buildTokenExplainerSlides, resolveTokenExplainerDialogLayout } from "../features/contribution/tokenExplainer";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";
import { useAccountEventSignal } from "../services/graphql/accountEvents";

type ContributionOverviewData = {
  currentTokenBalance: number;
  allTokenMovements: {
    edges: Array<{
      cursor: string | null;
      node: {
        id: string;
        eventType: string;
        amountDelta: number;
        referenceType: string | null;
        referenceId: string | null;
        payload: Record<string, unknown> | null;
        createdAt: string;
      };
    }>;
    pageInfo: {
      endCursor: string | null;
      hasNextPage: boolean;
    };
    totalCount: number;
  };
};

const PAGE_SIZE = 10;

function formatSignedAmount(amountDelta: number) {
  return `${amountDelta > 0 ? "+" : ""}${amountDelta}`;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function movementDetailTranslationKey(movement: ContributionOverviewData["allTokenMovements"]["edges"][number]["node"]) {
  if (movement.eventType === "resource_bid_settled") {
    return "movementDetails.resourceBidSettled.accepted";
  }

  if (movement.eventType !== "resource_bid_refunded") {
    return null;
  }

  const reason = asText(movement.payload?.reason);

  switch (reason) {
    case "bid_cancelled_by_bidder":
      return "movementDetails.resourceBidRefunded.bidCancelledByBidder";
    case "bid_declined":
      return "movementDetails.resourceBidRefunded.bidDeclined";
    case "bid_validity_expired":
      return "movementDetails.resourceBidRefunded.bidValidityExpired";
    case "resource_expired":
      return "movementDetails.resourceBidRefunded.resourceExpired";
    case "resource_deactivated":
      return "movementDetails.resourceBidRefunded.resourceDeactivated";
    default:
      return "movementDetails.resourceBidRefunded.fallback";
  }
}

const TOPES_EARNING_OPPORTUNITIES = [
  { key: "profileAvatar", amount: 20, href: "/profile" },
  { key: "profileBio", amount: 20, href: "/profile" },
  { key: "profileLocation", amount: 20, href: "/profile" },
  { key: "profileFirstLink", amount: 20, href: "/profile" },
  { key: "resourceFirstImage", amount: 20, href: "/resources/create" },
  { key: "resourceDefaultTokenAmount", amount: 20, href: "/resources/create" },
  { key: "resourceAge24h", amount: 20, href: "/resources/manage" },
  { key: "claimAge24h", amount: 10, href: "/claims" },
  { key: "campaignAirdrop", amount: null, href: "/campaigns" }
] as const;

export default function ContributionPage() {
  const { session } = useAuth();
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const { t } = useTranslation("contribution");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { data, loading, error, refetch } = useQuery<ContributionOverviewData>(CONTRIBUTION_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !isAuthenticated,
    notifyOnNetworkStatusChange: true,
    variables: { first: PAGE_SIZE, viewerId: session.account?.id ?? "" }
  });

  useAccountEventSignal(() => { void refetch(); }, isAuthenticated);
  const [giftTokens, { loading: gifting, error: giftError }] = useMutation(GIFT_TOKENS_MUTATION);
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTokenExplainerOpen, setTokenExplainerOpen] = useState(false);
  const [tokenExplainerSlideIndex, setTokenExplainerSlideIndex] = useState(0);

  const tokenExplainerSlides = useMemo(() => buildTokenExplainerSlides(t), [t]);
  const tokenExplainerDialogLayout = useMemo(() => resolveTokenExplainerDialogLayout(isMobile), [isMobile]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(giftError);
  const movementEdges = data?.allTokenMovements.edges ?? [];
  const movements = movementEdges.map(edge => edge.node);
  const hasMoreMovements = Boolean(data?.allTokenMovements.pageInfo.hasNextPage);
  const lastMovementCursor = data?.allTokenMovements.pageInfo.endCursor ?? null;
  const balance = data?.currentTokenBalance ?? 0;
  const currentTokenExplainerSlide = tokenExplainerSlides[
    Math.min(tokenExplainerSlideIndex, Math.max(0, tokenExplainerSlides.length - 1))
  ];

  const openTokenExplainer = () => {
    setTokenExplainerSlideIndex(0);
    setTokenExplainerOpen(true);
  };

  const closeTokenExplainer = () => {
    setTokenExplainerOpen(false);
  };

  const goToPreviousTokenExplainerSlide = () => {
    setTokenExplainerSlideIndex(current => Math.max(0, current - 1));
  };

  const goToNextTokenExplainerSlide = () => {
    setTokenExplainerSlideIndex(current => Math.min(tokenExplainerSlides.length - 1, current + 1));
  };

  const handleGift = async () => {
    setGiftSuccess(null);

    const parsedAmount = Number.parseInt(giftAmount, 10);
    if (!recipientAccountId.trim() || !Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    await giftTokens({
      variables: {
        input: {
          recipientAccountId: recipientAccountId.trim(),
          amount: parsedAmount,
          message: giftMessage.trim() || null
        }
      }
    });

    setGiftAmount("");
    setGiftMessage("");
    setGiftSuccess(t("giftSent"));
    await refetch({ first: PAGE_SIZE, after: null });
  };

  const handleLoadMoreMovements = async () => {
    if (!hasMoreMovements || !lastMovementCursor || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);

    try {
      await refetch({
        first: movements.length + PAGE_SIZE,
        after: null
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

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
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Box>
            <Typography component="h1" gutterBottom variant="h4">
              {t("title")}
            </Typography>
            <Typography color="text.secondary">
              {t("subtitle")}
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip color={balance >= 0 ? "success" : "error"} label={t("topesAmount", { amount: balance })} />
            <Chip label={t("ledgerEntriesCount", { count: movements.length })} variant="outlined" />
            <Button onClick={openTokenExplainer} size="small" variant="outlined">
              {t("topesGuide.openButton")}
            </Button>
          </Stack>

          <Alert severity="info">
            {t("ledgerInfo")}
          </Alert>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">{t("opportunities.title")}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {t("opportunities.subtitle")}
                  </Typography>
                </Box>

                <Stack spacing={1}>
                  {TOPES_EARNING_OPPORTUNITIES.map(opportunity => (
                    <Stack
                      alignItems={{ xs: "flex-start", md: "center" }}
                      direction={{ xs: "column", md: "row" }}
                      justifyContent="space-between"
                      key={opportunity.key}
                      spacing={1}
                      sx={{ border: theme => `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 1.5 }}
                    >
                      <Typography variant="body2">{t(`opportunities.items.${opportunity.key}`)}</Typography>

                      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Chip
                          color="primary"
                          label={
                            opportunity.amount === null
                              ? t("opportunities.variableAmount")
                              : t("topesAmount", { amount: opportunity.amount })
                          }
                          size="small"
                          variant="outlined"
                        />
                        <Button component={NextLink} href={opportunity.href} size="small" variant="contained">
                          {t("opportunities.goButton")}
                        </Button>
                      </Stack>
                    </Stack>
                  ))}
                </Stack>

                <Box>
                  <Typography variant="h6">{t("giftForm.title")}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {t("giftForm.subtitle")}
                  </Typography>
                </Box>

                {giftSuccess ? <Alert severity="success">{giftSuccess}</Alert> : null}

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label={t("giftForm.recipientLabel")}
                    onChange={event => setRecipientAccountId(event.target.value)}
                    value={recipientAccountId}
                  />
                  <TextField
                    label={t("giftForm.amountLabel")}
                    onChange={event => setGiftAmount(event.target.value)}
                    type="number"
                    value={giftAmount}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label={t("giftForm.messageLabel")}
                  minRows={2}
                  multiline
                  onChange={event => setGiftMessage(event.target.value)}
                  value={giftMessage}
                />

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    disabled={gifting || !recipientAccountId.trim() || !giftAmount.trim()}
                    onClick={() => void handleGift()}
                    variant="contained"
                  >
                    {gifting ? t("giftForm.sendingButton") : t("giftForm.sendButton")}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {loading ? <Alert severity="info">{t("loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {movements.length === 0 ? (
            <Alert severity="info">{t("empty")}</Alert>
          ) : (
            <Stack spacing={1.5}>
              {movements.map(movement => (
                <Card key={movement.id} variant="outlined">
                  <CardContent>
                    {(() => {
                      const movementDetailKey = movementDetailTranslationKey(movement);

                      return (
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="body1">{t(`movements.${movement.eventType}`, { defaultValue: movement.eventType.replaceAll("_", " ").toLowerCase() })}</Typography>
                        {movementDetailKey ? (
                          <Typography color="text.secondary" variant="body2">
                            {t(movementDetailKey)}
                          </Typography>
                        ) : null}
                        <Typography color="text.secondary" variant="caption">
                          {new Date(movement.createdAt).toLocaleString()}
                          {movement.referenceType && movement.referenceId
                            ? ` • ${movement.referenceType} ${movement.referenceId}`
                            : ""}
                        </Typography>
                      </Stack>

                      <Chip
                        color={movement.amountDelta >= 0 ? "success" : "error"}
                        label={t("topesAmount", { amount: formatSignedAmount(movement.amountDelta) })}
                        size="small"
                      />
                    </Stack>
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}

              {hasMoreMovements ? (
                <Stack direction="row" justifyContent="center">
                  <Button disabled={isLoadingMore} onClick={() => void handleLoadMoreMovements()} variant="outlined">
                    {isLoadingMore ? t("loadingMore") : t("loadMore")}
                  </Button>
                </Stack>
              ) : null}
            </Stack>
          )}
        </Stack>
      </Box>

      <Dialog
        fullScreen={tokenExplainerDialogLayout.fullScreen}
        fullWidth
        maxWidth={tokenExplainerDialogLayout.maxWidth}
        onClose={closeTokenExplainer}
        open={isTokenExplainerOpen}
      >
        <DialogTitle>{t("topesGuide.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="caption">
              {t("topesGuide.stepLabel", {
                current: tokenExplainerSlideIndex + 1,
                total: tokenExplainerSlides.length
              })}
            </Typography>

            <LinearProgress
              value={((tokenExplainerSlideIndex + 1) / tokenExplainerSlides.length) * 100}
              variant="determinate"
            />

            <Box>
              <Typography gutterBottom variant="h6">
                {currentTokenExplainerSlide.title}
              </Typography>
              <Typography color="text.secondary">
                {currentTokenExplainerSlide.body}
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeTokenExplainer}>{t("topesGuide.closeButton")}</Button>
          <Button disabled={tokenExplainerSlideIndex === 0} onClick={goToPreviousTokenExplainerSlide}>
            {t("topesGuide.previousButton")}
          </Button>
          <Button
            disabled={tokenExplainerSlideIndex === tokenExplainerSlides.length - 1}
            onClick={goToNextTokenExplainerSlide}
            variant="contained"
          >
            {t("topesGuide.nextButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
