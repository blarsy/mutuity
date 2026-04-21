import { Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { LoginForm } from "./LoginForm";

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
  nextDestination?: string;
  title?: string;
  subtitle?: string;
};

export function LoginDialog({
  open,
  onClose,
  nextDestination = "/",
  title,
  subtitle
}: LoginDialogProps) {
  const { t } = useTranslation("auth");
  const resolvedTitle = title ?? t("dialog.title");
  const resolvedSubtitle = subtitle ?? t("dialog.subtitle");

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{resolvedTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary" variant="body2">
            {resolvedSubtitle}
          </Typography>

          <LoginForm
            nextDestination={nextDestination}
            onSecondaryActionClick={onClose}
            onSuccess={async () => {
              onClose();
            }}
          />

          <Button onClick={onClose}>{t("dialog.close")}</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
