import { useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

export function CampaignListingRejectionDialog({ open, busy, error, onClose, onConfirm }: {
  open: boolean;
  busy: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (note: string | undefined) => Promise<void>;
}) {
  const { t } = useTranslation("campaigns");
  const [note, setNote] = useState("");
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <DialogTitle>{t("listingLifecycle.rejectTitle")}</DialogTitle>
    <DialogContent>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField autoFocus fullWidth multiline minRows={3} margin="dense"
        label={t("listingLifecycle.rejectionNote")} value={note} disabled={busy}
        onChange={event => setNote(event.target.value)} />
    </DialogContent>
    <DialogActions>
      <Button disabled={busy} onClick={onClose}>{t("listingLifecycle.cancel")}</Button>
      <Button color="error" variant="contained" disabled={busy} onClick={() => void onConfirm(note.trim() || undefined)}>
        {t("triage.reject")}
      </Button>
    </DialogActions>
  </Dialog>;
}