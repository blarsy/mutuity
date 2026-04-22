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
  const { t } = useTranslation("needs");
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
      return t("claimDialog.updateClaimNote");
    }

    if (existingClaim) {
      return t("claimDialog.claimAgain", { status: existingClaim.status.toLowerCase() });
    }

    return t("claimDialog.claimThisNeed");
  }, [existingClaim, t]);

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
          <Button onClick={() => void handleSubmit()} disabled={loading} variant="contained">
            {loading ? t("claimDialog.saving") : existingClaim ? t("claimDialog.saveClaim") : t("claimDialog.submitClaim")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
