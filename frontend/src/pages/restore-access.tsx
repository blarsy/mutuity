import { Alert } from "@mui/material";

import { PlaceholderPage } from "../features/layout/PlaceholderPage";

export default function RestoreAccessPage() {
  return (
    <PlaceholderPage
      title="Restore access"
      description="Password-reset request and reset-token completion will live here."
    >
      <Alert severity="info">
        The reset-password flow has been reserved in the new navigation architecture and will be implemented in a later slice.
      </Alert>
    </PlaceholderPage>
  );
}
