import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "Mutuity";

export default function TermsPage() {
  const { t } = useTranslation("legal");
  const tokenIsNot = t("terms.tokenIsNot", { returnObjects: true }) as unknown as string[];
  const tokenProperties = t("terms.tokenProperties", { returnObjects: true }) as unknown as string[];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom variant="h4">
          {t("terms.title")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("terms.sections.purposeTitle")}
        </Typography>
        <Typography paragraph>
          {t("terms.sections.purposeBody", { productName: PRODUCT_NAME })}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("terms.sections.tokenNatureTitle")}
        </Typography>
        <Typography paragraph>
          {t("terms.sections.tokenNatureBody", { productName: PRODUCT_NAME })}
        </Typography>
        <List dense>
          {tokenIsNot.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>
        <Typography paragraph>
          {t("terms.sections.tokenPropertiesTitle")}
        </Typography>
        <List dense>
          {tokenProperties.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Typography gutterBottom variant="h6">
          {t("terms.sections.exchangesTitle")}
        </Typography>
        <Typography paragraph>
          {t("terms.sections.exchangesBody")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("terms.sections.endowmentTitle")}
        </Typography>
        <Typography paragraph>
          {t("terms.sections.endowmentBody")}
        </Typography>

        <Typography gutterBottom variant="h6">
          {t("terms.sections.transparencyTitle")}
        </Typography>
        <Typography paragraph>
          {t("terms.sections.transparencyBody", { productName: PRODUCT_NAME })}
        </Typography>
      </Box>
    </Container>
  );
}
