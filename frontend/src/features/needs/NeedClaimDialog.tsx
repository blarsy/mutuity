import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import { useTranslation } from "react-i18next";

import { getUserFacingGraphQLErrorMessage } from "../../services/graphql/errorMessages";
import { CLAIM_NEED_MUTATION } from "./needClaims.queries";
import type { ClaimNeedMutation, ClaimNeedMutationVariables } from "../../graphql/generated";

type NeedClaimDialogProps = {
  needId: string;
  needTitle: string;
  existingClaim?: {
    id: string;
    message: string | null;
    status: string;
  } | null;
  disabled?: boolean;
  iconOnly?: boolean;
  disabledReason?: string | null;
  onClaimed?: (claimId: string) => void;
};

export function NeedClaimDialog({
  needId,
  needTitle,
  existingClaim,
  disabled = false,
  iconOnly = false,
  disabledReason,
  onClaimed
}: NeedClaimDialogProps) {
  const { t } = useTranslation("needs");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(existingClaim?.message ?? "");
  const [claimNeed, { loading, error }] = useMutation<ClaimNeedMutation>(CLAIM_NEED_MUTATION);

  useEffect(() => {
    if (!open) {
      setMessage(existingClaim?.message ?? "");
    }
  }, [existingClaim?.message, open]);

  const buttonLabel = useMemo(() => {
    if (existingClaim?.status === "OPEN") {
      return t("claimDialog.updateClaimNote");
    }

    if (existingClaim) {
      return t("claimDialog.claimAgain", { status: existingClaim.status.toLowerCase() });
    }

    return t("claimDialog.claimThisNeed");
  }, [existingClaim, t]);

  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const handleSubmit = async () => {
    if (loading || disabled) return;
    try {
      const result = await claimNeed({
        variables: {
          input: {
            needId,
            message: message.trim() || null
          }
        }
      });

      const claimId = result.data?.claimNeed?.needClaim?.id;

      if (claimId) {
        setOpen(false);
        onClaimed?.(claimId);
      }
    } catch {
      // Apollo exposes the error above; preserve the message for retry.
    }
  };

  return (
    <>
      <Stack alignItems={iconOnly ? "flex-start" : { xs: "stretch", sm: "flex-start" }} spacing={1}>
        {iconOnly ? (
          <Tooltip title={buttonLabel}>
            <span>
              <IconButton aria-label={buttonLabel} aria-haspopup="dialog" color="primary"
                disabled={disabled} onClick={() => setOpen(true)}>
                <WavingHandIcon fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <Button disabled={disabled} onClick={() => setOpen(true)} variant="contained">
            {buttonLabel}
          </Button>
        )}
        {disabledReason ? (
          <Typography color="text.secondary" variant="caption">
            {disabledReason}
          </Typography>
        ) : null}
      </Stack>

      <Dialog fullWidth maxWidth="sm" onClose={() => { if (!loading) setOpen(false); }} open={open}>
        <DialogTitle>{existingClaim ? t("claimDialog.updateYourClaim") : t("claimDialog.claimThisNeed")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography color="text.secondary" variant="body2">
              {t("claimDialog.claimingHintPrefix")} <strong>{needTitle}</strong>. {t("claimDialog.claimingHintSuffix")}
            </Typography>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              fullWidth
              label={t("claimDialog.optionalMessage")}
              minRows={4}
              multiline
              placeholder={t("claimDialog.placeholder")}
              value={message}
              onChange={event => setMessage(event.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading || disabled} variant="contained">
            {loading ? t("claimDialog.saving") : existingClaim ? t("claimDialog.saveClaim") : t("claimDialog.submitClaim")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
