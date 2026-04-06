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
      return "Response accepted";
    }

    if (existingBid?.status === "OPEN") {
      return "Update your response";
    }

    if (existingBid) {
      return `Respond again (${formatBidStatus(existingBid.status)})`;
    }

    return "Respond to this resource";
  }, [acceptedAlready, existingBid]);

  const errorMessage = localError ?? getUserFacingGraphQLErrorMessage(error);

  const handleSubmit = async () => {
    const trimmedTokenAmount = tokenAmount.trim();
    const parsedTokenAmount = trimmedTokenAmount === "" ? null : Number.parseInt(trimmedTokenAmount, 10);

    if (trimmedTokenAmount !== "" && (!Number.isInteger(parsedTokenAmount) || (parsedTokenAmount ?? 0) <= 0)) {
      setLocalError("Please enter a positive whole number for the token amount, or leave it empty.");
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
    ? "Your response has already been accepted for this resource."
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
        <DialogTitle>{existingBid ? "Update your response" : "Respond to this resource"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              You are responding to <strong>{resourceTitle}</strong>. Add a short note and optionally propose a token amount.
            </Typography>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              fullWidth
              label="Optional message"
              minRows={4}
              multiline
              placeholder="Describe your availability, what you can offer, or any coordination details."
              value={message}
              onChange={event => setMessage(event.target.value)}
            />

            <TextField
              fullWidth
              helperText={defaultTokenAmount ? `Suggested default: ${defaultTokenAmount} tokens` : "Optional and negotiable."}
              inputMode="numeric"
              label="Proposed token amount"
              placeholder={defaultTokenAmount?.toString() ?? "Leave blank if not needed"}
              value={tokenAmount}
              onChange={event => setTokenAmount(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={loading} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={loading} onClick={() => void handleSubmit()} variant="contained">
            {loading ? "Saving…" : existingBid ? "Save response" : "Send response"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
