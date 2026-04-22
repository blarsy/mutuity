import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { CREATE_RESOURCE_BID_MUTATION } from "./resources.queries";
import type { ResourceBidStatus } from "./types";

type ExistingResourceBid = {
  id: string;
  message: string | null;
  proposedTokenAmount: number | null;
  status: ResourceBidStatus;
};

type CreateResourceBidMutationData = {
  submitResourceBid: {
    resourceBid: {
      id: string;
    };
  };
};

type ResourceBidDialogProps = {
  resourceId: string;
  resourceTitle: string;
  defaultTokenAmount: number | null;
  existingBid?: ExistingResourceBid | null;
  disabled?: boolean;
  disabledReason?: string | null;
  onSubmitted?: (bidId: string) => void;
};

function formatBidStatus(status: ResourceBidStatus) {
  return status.replaceAll("_", " ").toLowerCase();
}

export function ResourceBidDialog({
  resourceId,
  resourceTitle,
  defaultTokenAmount,
  existingBid,
  disabled = false,
  disabledReason,
  onSubmitted
}: ResourceBidDialogProps) {
  const { t } = useTranslation("resources");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(existingBid?.message ?? "");
  const [tokenAmount, setTokenAmount] = useState(
    existingBid?.proposedTokenAmount?.toString() ?? defaultTokenAmount?.toString() ?? ""
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [createResourceBid, { loading, error }] = useMutation<CreateResourceBidMutationData>(
    CREATE_RESOURCE_BID_MUTATION
  );

  useEffect(() => {
    if (!open) {
      setMessage(existingBid?.message ?? "");
      setTokenAmount(existingBid?.proposedTokenAmount?.toString() ?? defaultTokenAmount?.toString() ?? "");
      setLocalError(null);
    }
  }, [defaultTokenAmount, existingBid?.message, existingBid?.proposedTokenAmount, open]);

  const acceptedAlready = existingBid?.status === "ACCEPTED";
  const buttonLabel = useMemo(() => {
    if (acceptedAlready) {
      return t("bidDialog.responseAccepted");
    }

    if (existingBid?.status === "OPEN") {
      return t("bidDialog.updateResponse");
    }

    if (existingBid) {
      return t("bidDialog.respondAgain", { status: formatBidStatus(existingBid.status) });
    }

    return t("bidDialog.respondToResource");
  }, [acceptedAlready, existingBid, t]);

  const errorMessage = localError ?? getUserFacingGraphQLErrorMessage(error);

  const handleSubmit = async () => {
    const trimmedTokenAmount = tokenAmount.trim();
    const parsedTokenAmount = trimmedTokenAmount === "" ? null : Number.parseInt(trimmedTokenAmount, 10);

    if (trimmedTokenAmount !== "" && (!Number.isInteger(parsedTokenAmount) || (parsedTokenAmount ?? 0) <= 0)) {
      setLocalError(t("bidDialog.invalidTokenAmount"));
      return;
    }

    setLocalError(null);

    const result = await createResourceBid({
      variables: {
        input: {
          resourceId,
          message: message.trim() || null,
          proposedTokenAmount: parsedTokenAmount
        }
      }
    });

    const bidId = result.data?.submitResourceBid.resourceBid.id;

    if (bidId) {
      setOpen(false);
      onSubmitted?.(bidId);
    }
  };

  const resolvedDisabledReason = acceptedAlready
    ? t("bidDialog.alreadyAccepted")
    : disabledReason;

  return (
    <>
      <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1}>
        <Button disabled={disabled || acceptedAlready} onClick={() => setOpen(true)} variant="contained">
          {buttonLabel}
        </Button>
        {resolvedDisabledReason ? (
          <Typography color="text.secondary" variant="caption">
            {resolvedDisabledReason}
          </Typography>
        ) : null}
      </Stack>

      <Dialog fullWidth maxWidth="sm" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>{existingBid ? t("bidDialog.updateResponse") : t("bidDialog.respondToResource")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {t("bidDialog.respondingToPrefix")} <strong>{resourceTitle}</strong>. {t("bidDialog.respondingToSuffix")}
            </Typography>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              fullWidth
              label={t("bidDialog.optionalMessage")}
              minRows={4}
              multiline
              placeholder={t("bidDialog.optionalMessagePlaceholder")}
              value={message}
              onChange={event => setMessage(event.target.value)}
            />

            <TextField
              fullWidth
              helperText={defaultTokenAmount ? t("bidDialog.suggestedDefault", { amount: defaultTokenAmount }) : t("bidDialog.optionalNegotiable")}
              inputMode="numeric"
              label={t("bidDialog.proposedTokenAmount")}
              placeholder={defaultTokenAmount?.toString() ?? t("bidDialog.leaveBlank")}
              value={tokenAmount}
              onChange={event => setTokenAmount(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpen(false)}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button disabled={loading} onClick={() => void handleSubmit()} variant="contained">
            {loading ? t("bidDialog.saving") : existingBid ? t("bidDialog.saveResponse") : t("bidDialog.sendResponse")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
