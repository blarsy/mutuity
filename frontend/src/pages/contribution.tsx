import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Alert, Box, Button, Card, CardContent, Chip, Container, Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

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

function formatSignedAmount(amountDelta: number) {
  return `${amountDelta > 0 ? "+" : ""}${amountDelta}`;
}

export default function ContributionPage() {
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const { t } = useTranslation("contribution");
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
    setGiftSuccess(t("giftSent"));
    await refetch();
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
    <Container maxWidth="lg">
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
          </Stack>

          <Alert severity="info">
            {t("ledgerInfo")}
          </Alert>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
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
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="body1">{t(`movements.${movement.eventType}`, { defaultValue: movement.eventType.replaceAll("_", " ").toLowerCase() })}</Typography>
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
