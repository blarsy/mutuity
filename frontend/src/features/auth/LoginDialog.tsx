import { Button, Dialog, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

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
  title = "Sign in",
  subtitle = "Access protected actions and your account session."
}: LoginDialogProps) {
  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary" variant="body2">
            {subtitle}
          </Typography>

          <LoginForm
            nextDestination={nextDestination}
            onSecondaryActionClick={onClose}
            onSuccess={async () => {
              onClose();
            }}
          />

          <Button onClick={onClose}>Close</Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
