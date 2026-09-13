import { useState } from "react";
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

import { changePassword } from "./auth.api";
import { validateChangePasswordForm } from "./changePassword.validation";

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  disablePortal?: boolean;
};

export function ChangePasswordDialog({
  open,
  onClose,
  onSuccess,
  disablePortal
}: ChangePasswordDialogProps) {
  const { t } = useTranslation("auth");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    setCurrentPasswordError(null);
    setNewPasswordError(null);
    setConfirmPasswordError(null);

    const validation = validateChangePasswordForm({
      currentPassword,
      newPassword,
      confirmPassword
    });

    if (!validation.valid) {
      if (validation.errors.currentPassword) {
        setCurrentPasswordError(
          t("changePassword.currentPasswordRequired", { defaultValue: "Current password is required." })
        );
      }
      if (validation.errors.newPassword) {
        if (!newPassword) {
          setNewPasswordError(t("changePassword.fieldRequired", { defaultValue: "This field is required." }));
        } else {
          setNewPasswordError(
            t("changePassword.passwordTooShort", { defaultValue: "Password must be at least 8 characters." })
          );
        }
      }
      if (validation.errors.confirmPassword) {
        if (!confirmPassword) {
          setConfirmPasswordError(t("changePassword.fieldRequired", { defaultValue: "This field is required." }));
        } else {
          setConfirmPasswordError(
            t("changePassword.passwordMismatch", { defaultValue: "Passwords do not match." })
          );
        }
      }
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        currentPassword,
        newPassword
      });
      resetForm();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.genericRetry", { ns: "common", defaultValue: "Something went wrong. Please try again." }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      data-testid="change-password-dialog"
      disablePortal={disablePortal}
      fullWidth
      maxWidth="sm"
      onClose={handleClose}
      open={open}
    >
      <DialogTitle>{t("changePassword.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary" variant="body2">
            {t("changePassword.subtitle")}
          </Typography>

          {error ? (
            <Alert data-testid="change-password-error" severity="error">
              {error}
            </Alert>
          ) : null}

          <TextField
            autoComplete="current-password"
            autoFocus
            disabled={loading}
            error={Boolean(currentPasswordError)}
            helperText={currentPasswordError ?? ""}
            inputProps={{ "data-testid": "change-password-current-input" }}
            label={t("changePassword.currentPasswordLabel")}
            onChange={event => {
              setCurrentPassword(event.target.value);
              setCurrentPasswordError(null);
              setError(null);
            }}
            required
            type="password"
            value={currentPassword}
          />

          <TextField
            autoComplete="new-password"
            disabled={loading}
            error={Boolean(newPasswordError)}
            helperText={newPasswordError ?? t("changePassword.newPasswordHelper")}
            inputProps={{ "data-testid": "change-password-new-input" }}
            label={t("changePassword.newPasswordLabel")}
            onChange={event => {
              setNewPassword(event.target.value);
              setNewPasswordError(null);
              setError(null);
            }}
            required
            type="password"
            value={newPassword}
          />

          <TextField
            autoComplete="new-password"
            disabled={loading}
            error={Boolean(confirmPasswordError)}
            helperText={confirmPasswordError ?? ""}
            inputProps={{ "data-testid": "change-password-confirm-input" }}
            label={t("changePassword.confirmPasswordLabel")}
            onChange={event => {
              setConfirmPassword(event.target.value);
              setConfirmPasswordError(null);
              setError(null);
            }}
            required
            type="password"
            value={confirmPassword}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          data-testid="change-password-cancel"
          disabled={loading}
          onClick={handleClose}
        >
          {t("changePassword.cancelButton", { defaultValue: "Cancel" })}
        </Button>
        <Button
          data-testid="change-password-confirm"
          disabled={loading}
          onClick={() => void handleSubmit()}
          variant="contained"
        >
          {loading
            ? t("changePassword.submitButton", { defaultValue: "Update password" })
            : t("changePassword.okButton", { defaultValue: "OK" })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
