import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, TextField, Typography } from "@mui/material";

import { useRequireAuth } from "../features/auth/requireAuth";
import { CONTRIBUTION_OVERVIEW_QUERY, GIFT_TOKENS_MUTATION } from "../features/contribution/contribution.queries";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";

type ContributionOverviewData = {
  currentTokenBalance: number;
  allTokenMovements: {
    nodes: Array<{
      id: string;
      eventType: string;
      amountDelta: number;
      referenceType: string | null;
      referenceId: string | null;
      payload: Record<string, unknown> | null;
      createdAt: string;
    }>;
  };
};

function formatMovementTitle(eventType: string) {
  switch (eventType) {
    case "resource_bid_reserved":
      return "Bid created / tokens reserved";
    case "resource_bid_refunded":
      return "Bid refunded";
    case "claim_settlement_credit":
      return "Claim settled in your favor";
    case "claim_settlement_debit":
      return "You settled a claim on your need";
    case "resource_age_24h_reward":
      return "Resource reached the 24-hour milestone";
    case "claim_age_24h_reward":
      return "Claim stayed valid for 24 hours";
    case "campaign_airdrop_received":
      return "Campaign airdrop received";
    default:
      return eventType.replaceAll("_", " ").toLowerCase();
  }
}

function formatAmount(amountDelta: number) {
  return `${amountDelta > 0 ? "+" : ""}${amountDelta} Topes`;
}

export default function ContributionPage() {
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const { data, loading, error, refetch } = useQuery<ContributionOverviewData>(CONTRIBUTION_OVERVIEW_QUERY, {
    pollInterval: isAuthenticated ? 15000 : 0,
    skip: !isAuthenticated,
    variables: { first: 50 }
  });
  const [giftTokens, { loading: gifting, error: giftError }] = useMutation(GIFT_TOKENS_MUTATION);
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSuccess, setGiftSuccess] = useState<string | null>(null);

  const errorMessage = getUserFacingGraphQLErrorMessage(error) ?? getUserFacingGraphQLErrorMessage(giftError);
  const movements = data?.allTokenMovements.nodes ?? [];
  const balance = data?.currentTokenBalance ?? 0;

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
    setGiftSuccess("Gift sent.");
    await refetch();
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            Contribution
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
              Contribution
            </Typography>
            <Typography color="text.secondary">
              Review your current Topes balance and the ledger events currently recorded from bids and settled claims.
            </Typography>
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Chip color={balance >= 0 ? "success" : "error"} label={`${balance} Topes`} />
            <Chip label={`${movements.length} ledger entries`} variant="outlined" />
          </Stack>

          <Alert severity="info">
            This ledger slice records bid reserves/refunds, claim settlement transfers, direct gifts between accounts, delayed 24-hour rewards, and campaign airdrop payouts.
          </Alert>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">Send a gift</Typography>
                  <Typography color="text.secondary" variant="body2">
                    Transfer Topes to another account. For now, enter the recipient account id directly.
                  </Typography>
                </Box>

                {giftSuccess ? <Alert severity="success">{giftSuccess}</Alert> : null}

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label="Recipient account id"
                    onChange={event => setRecipientAccountId(event.target.value)}
                    value={recipientAccountId}
                  />
                  <TextField
                    label="Amount"
                    onChange={event => setGiftAmount(event.target.value)}
                    type="number"
                    value={giftAmount}
                  />
                </Stack>

                <TextField
                  fullWidth
                  label="Optional message"
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
                    {gifting ? "Sending…" : "Send gift"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {loading ? <Alert severity="info">Loading your contribution history…</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {movements.length === 0 ? (
            <Alert severity="info">No token movements recorded yet.</Alert>
          ) : (
            <Stack spacing={1.5}>
              {movements.map(movement => (
                <Card key={movement.id} variant="outlined">
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="body1">{formatMovementTitle(movement.eventType)}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {new Date(movement.createdAt).toLocaleString()}
                          {movement.referenceType && movement.referenceId
                            ? ` • ${movement.referenceType} ${movement.referenceId}`
                            : ""}
                        </Typography>
                      </Stack>

                      <Chip
                        color={movement.amountDelta >= 0 ? "success" : "error"}
                        label={formatAmount(movement.amountDelta)}
                        size="small"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Box>
    </Container>
  );
}
