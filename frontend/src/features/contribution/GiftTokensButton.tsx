import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, TextField, Tooltip, Typography } from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/VolunteerActivism";
import { useTranslation } from "react-i18next";

import { useAuth } from "../auth/AuthProvider";
import { GIFT_TOKENS_MUTATION } from "./contribution.queries";
import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";

type GiftTokensButtonProps = {
  recipientAccountId: string;
  recipientDisplayName?: string | null;
};

export function parseGiftAmount(value: string): number | null {
  const amount = Number(value);
  return Number.isInteger(amount) && amount > 0 && amount <= 2147483647 ? amount : null;
}

export function GiftTokensButton({ recipientAccountId, recipientDisplayName }: GiftTokensButtonProps) {
  const { session } = useAuth();
  const { t } = useTranslation("contribution");
  const [open, setOpen] = useState(false);

  if (!session.authenticated || !session.account?.id || !recipientAccountId || session.account.id === recipientAccountId) {
    return null;
  }

  return (
    <>
      <Tooltip title={t("giftForm.title")}>
        <IconButton aria-label={t("giftForm.title")} color="primary" onClick={() => setOpen(true)}>
          <CardGiftcardIcon fontSize="large" />
        </IconButton>
      </Tooltip>
      {open ? (
        <GiftTokensDialog
          key={recipientAccountId}
          recipientAccountId={recipientAccountId}
          recipientDisplayName={recipientDisplayName}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}

export function GiftTokensDialog({ recipientAccountId, recipientDisplayName, onClose }: GiftTokensButtonProps & { onClose: () => void }) {
  const { t } = useTranslation("contribution");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [giftTokens, { loading, error }] = useMutation(GIFT_TOKENS_MUTATION, {
    refetchQueries: ["TokenBalance", "ContributionOverview"]
  });
  const parsedAmount = parseGiftAmount(amount);
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const handleGift = async () => {
    if (loading || sent || parsedAmount === null) return;

    try {
      await giftTokens({
        variables: {
          input: {
            recipientAccountId,
            amount: parsedAmount,
            message: message.trim() || null
          }
        }
      });
      setSent(true);
    } catch {
      // Apollo exposes the mutation error above; keep the form available for retry.
    }
  };

  return (
    <Dialog open onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth aria-labelledby="gift-tokens-title">
      <DialogTitle id="gift-tokens-title">{t("giftForm.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary" variant="body2">
            {recipientDisplayName ? t("giftForm.recipient", { name: recipientDisplayName }) : t("giftForm.subtitle")}
          </Typography>
          {sent ? <Alert severity="success">{t("giftSent")}</Alert> : (
            <>
              {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
              <TextField
                autoFocus
                fullWidth
                required
                disabled={loading}
                label={t("giftForm.amountLabel")}
                type="number"
                inputProps={{ min: 1, max: 2147483647, step: 1 }}
                value={amount}
                onChange={event => setAmount(event.target.value)}
              />
              <TextField
                fullWidth
                disabled={loading}
                label={t("giftForm.messageLabel")}
                multiline
                minRows={2}
                value={message}
                onChange={event => setMessage(event.target.value)}
              />
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={loading} onClick={onClose}>{t("giftForm.closeButton")}</Button>
        {!sent ? (
          <Button disabled={loading || parsedAmount === null} onClick={() => void handleGift()} variant="contained">
            {loading ? t("giftForm.sendingButton") : t("giftForm.sendButton")}
          </Button>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}