import { Box, Container, Divider, List, ListItem, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function CollectivePage() {
  const { t } = useTranslation("collective");
  const signals = t("signals", { returnObjects: true }) as unknown as string[];
  const pillars = t("pillars", { returnObjects: true }) as unknown as string[];
  const mindsetElements = t("mindset", { returnObjects: true }) as unknown as string[];
  const neededSkills = t("skills", { returnObjects: true }) as unknown as string[];

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Typography component="h1" gutterBottom textAlign="center" variant="h4">
          {t("title")}
        </Typography>

        <Typography paragraph>{t("signalsLead")}</Typography>
        <List dense>
          {signals.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography paragraph>{t("missionP1")}</Typography>
        <Typography paragraph>{t("missionP2")}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography paragraph>{t("opalLeadP1")}</Typography>
        <Typography paragraph>{t("opalLeadP2")}</Typography>
        <List dense>
          {pillars.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography paragraph>{t("postPillarP1")}</Typography>
        <Typography paragraph>{t("postPillarP2")}</Typography>
        <Typography paragraph>{t("mindsetLead")}</Typography>
        <List dense>
          {mindsetElements.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        <Typography paragraph>{t("skillsLead")}</Typography>
        <List dense>
          {neededSkills.map(item => (
            <ListItem key={item} sx={{ display: "list-item", py: 0.5 }}>
              {item}
            </ListItem>
          ))}
        </List>
        <Typography paragraph>{t("skillsOutro")}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography gutterBottom variant="h6">
          {t("compensationTitle")}
        </Typography>
        <Typography paragraph>{t("compensationP1")}</Typography>
        <Typography paragraph>{t("compensationP2")}</Typography>
        <Typography paragraph>{t("compensationP3")}</Typography>

        <Divider sx={{ my: 3 }} />

        <Typography textAlign="center" variant="subtitle1">
          {t("contactLead")}
          {" "}
          <a href="mailto:topela.hello@gmail.com">topela.hello@gmail.com</a>
          {" "}
          {t("contactTail")}
        </Typography>
      </Box>
    </Container>
  );
}
