import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "Mutuity";

export default function PrivacyPage() {
  const { t } = useTranslation("legal");
  const sharingCases = t("privacy.sharingCases", { returnObjects: true }) as unknown as string[];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("privacy.title")}
        </Typography>

        <Typography paragraph>
          {t("privacy.intro", { productName: PRODUCT_NAME })}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.dataCollectTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.dataCollectBody", { productName: PRODUCT_NAME })}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.dataUseTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.dataUseBody")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.dataSharingTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.dataSharingBody")}
        </Typography>
        <List dense>
          {sharingCases.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.securityTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.securityBody")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.retentionTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.retentionBody")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.rightsTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.rightsBody")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("privacy.sections.updatesTitle")}
        </Typography>
        <Typography paragraph>
          {t("privacy.sections.updatesBody")}
        </Typography>

        <Typography variant="body2">
          {t("privacy.contact")}
        </Typography>
      </Box>
    </Container>
  );
}
