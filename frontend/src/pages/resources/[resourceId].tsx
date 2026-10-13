import { Alert, Box } from "@mui/material";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { PageContainer } from "../../components/PageContainer";
import { ResourceDetailPage } from "../../features/resources/ResourceDetailPage";

export default function ResourceDetailRoute() {
  const { t } = useTranslation("resources");
  const router = useRouter();
  const resourceId = typeof router.query.resourceId === "string" ? router.query.resourceId : null;

  if (!resourceId) {
    return (
      <PageContainer>
        <Box sx={{ py: 6 }}>
          <Alert severity="info">{t("detail.loading")}</Alert>
        </Box>
      </PageContainer>
    );
  }

  return <ResourceDetailPage resourceId={resourceId} />;
}
