import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function SupportPage() {
  const { t } = useTranslation("support");
  const checklist = t("checklist", { returnObjects: true }) as unknown as string[];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom textAlign="center" variant="h4">
          {t("title")}
        </Typography>

        <Typography paragraph>{t("contactLead")}</Typography>

        <Typography paragraph textAlign="center" variant="h6">
          <a href="mailto:topela.hello@gmail.com">topela.hello@gmail.com</a>
        </Typography>

        <Typography paragraph>{t("checklistLead")}</Typography>

        <List dense>
          {checklist.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
}
