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
import { CLAIM_NEED_MUTATION } from "./needClaims.queries";

type NeedClaimDialogProps = {
  needId: string;
  needTitle: string;
  existingClaim?: {
    id: string;
    message: string | null;
    status: string;
  } | null;
  disabled?: boolean;
  disabledReason?: string | null;
  onClaimed?: (claimId: string) => void;
};

type ClaimNeedMutationData = {
  claimNeed: {
    needClaim: {
      id: string;
    };
  };
};

export function NeedClaimDialog({
  needId,
  needTitle,
  existingClaim,
  disabled = false,
  disabledReason,
  onClaimed
}: NeedClaimDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(existingClaim?.message ?? "");
  const [claimNeed, { loading, error }] = useMutation<ClaimNeedMutationData>(CLAIM_NEED_MUTATION);

  useEffect(() => {
    if (!open) {
      setMessage(existingClaim?.message ?? "");
    }
  }, [existingClaim?.message, open]);

  const buttonLabel = useMemo(() => {
    if (existingClaim?.status === "OPEN") {
      return "Update claim note";
    }

    if (existingClaim) {
      return `Claim again (${existingClaim.status.toLowerCase()})`;
    }

    return "Claim this need";
  }, [existingClaim]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const handleSubmit = async () => {
    const result = await claimNeed({
      variables: {
        input: {
          needId,
          message: message.trim() || null
        }
      }
    });

    const claimId = result.data?.claimNeed.needClaim.id;

    if (claimId) {
      setOpen(false);
      onClaimed?.(claimId);
    }
  };

  return (
    <>
      <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1}>
        <Button disabled={disabled} onClick={() => setOpen(true)} variant="contained">
          {buttonLabel}
        </Button>
        {disabledReason ? (
          <Typography color="text.secondary" variant="caption">
            {disabledReason}
          </Typography>
        ) : null}
      </Stack>

      <Dialog fullWidth maxWidth="sm" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>{existingClaim ? "Update your claim" : "Claim this need"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              You are claiming <strong>{needTitle}</strong>. Add an optional note so the creator knows how you can help.
            </Typography>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              fullWidth
              label="Optional message"
              minRows={4}
              multiline
              placeholder="Describe what you can do, when you are available, or anything the creator should know."
              value={message}
              onChange={event => setMessage(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading} variant="contained">
            {loading ? "Saving…" : existingClaim ? "Save claim" : "Submit claim"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
