import NextLink from "next/link";
import { Button, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { CampaignExplainerSlide } from "./campaignExplainer";
import { ExplainerDialog } from "../../components/explainer/ExplainerDialog";

type CampaignExplainerDialogProps = {
  open: boolean;
  onClose: () => void;
  slides: CampaignExplainerSlide[];
};

export function CampaignExplainerDialog({ open, onClose, slides }: CampaignExplainerDialogProps) {
  const { t } = useTranslation("campaigns");
  const labels = {
    stepLabel: "",
    close: t("public.explainer.close"),
    previous: t("public.explainer.previous"),
    next: t("public.explainer.next")
  };

  return (
    <ExplainerDialog
      visible={open}
      onClose={onClose}
      title={t("public.explainer.dialogTitle")}
      slides={slides}
      labels={labels}
      navigationMode="next-closes"
      renderSlide={slide => (
        <Stack spacing={2}>
          <Typography component="h3" variant="h6">{slide.title}</Typography>
          <Typography variant="body1">{slide.body}</Typography>
          {slide.details?.length ? (
            <Stack spacing={0.6}>
              {slide.details.map(detail => (
                <Typography color="text.secondary" key={detail} variant="body2">• {detail}</Typography>
              ))}
            </Stack>
          ) : null}
          {slide.ctas?.length ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              {slide.ctas.map(cta => (
                <Button
                  component={cta.external ? "a" : NextLink}
                  href={cta.href}
                  key={cta.label}
                  rel={cta.external ? "noreferrer" : undefined}
                  size="small"
                  target={cta.external ? "_blank" : undefined}
                  variant="outlined"
                >
                  {cta.label}
                </Button>
              ))}
            </Stack>
          ) : null}
        </Stack>
      )}
      renderProgress={(current, total) => t("public.explainer.progress", { current, total })}
    />
  );
}