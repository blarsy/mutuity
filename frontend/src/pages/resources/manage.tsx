import NextLink from "next/link";
import { Button } from "@mui/material";

import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function ManageResourcesPage() {
  return (
    <PlaceholderPage
      title="My resources"
      description="This page will list the resources created by the logged-in account."
    >
      <Button component={NextLink} href="/resources/create" variant="contained">
        Add
      </Button>
    </PlaceholderPage>
  );
}
