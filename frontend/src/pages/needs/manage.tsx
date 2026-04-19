import NextLink from "next/link";
import { Button } from "@mui/material";

import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function ManageNeedsPage() {
  return (
    <PlaceholderPage
      title="My needs"
      description="This page will list the needs created by the logged-in account."
    >
      <Button component={NextLink} href="/needs/create" variant="contained">
        Add
      </Button>
    </PlaceholderPage>
  );
}
