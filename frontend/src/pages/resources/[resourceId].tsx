import { Alert, Box, Container } from "@mui/material";
import { useRouter } from "next/router";

import { ResourceDetailPage } from "../../features/resources/ResourceDetailPage";

export default function ResourceDetailRoute() {
  const router = useRouter();
  const resourceId = typeof router.query.resourceId === "string" ? router.query.resourceId : null;

  if (!resourceId) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Alert severity="info">Loading resource…</Alert>
        </Box>
      </Container>
    );
  }

  return <ResourceDetailPage resourceId={resourceId} />;
}
