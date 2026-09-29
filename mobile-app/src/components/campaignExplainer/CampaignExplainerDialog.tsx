import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ExplainerDialog } from "../explainer/ExplainerDialog";
import { buildCampaignExplainerSlides } from "../../features/campaignExplainer";

export interface CampaignExplainerDialogProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

export function CampaignExplainerDialog({
  visible,
  onClose,
  testID
}: CampaignExplainerDialogProps): React.JSX.Element | null {
  const { t } = useTranslation("us1");

  const slides = useMemo(
    () => buildCampaignExplainerSlides((key) => t(key, { defaultValue: key })),
    [t]
  );

  return (
    <ExplainerDialog
      visible={visible}
      onClose={onClose}
      testID={testID}
      title={t("campaignsGuide.title", { ns: "us1", defaultValue: "Campaigns guide" })}
      slides={slides}
      labels={{
        stepLabel: t("campaignsGuide.stepLabel", {
          ns: "us1",
          defaultValue: "Step {{current}} of {{total}}"
        }),
        close: t("campaignsGuide.closeButton", { ns: "us1", defaultValue: "Close" }),
        previous: t("campaignsGuide.previousButton", { ns: "us1", defaultValue: "Previous" }),
        next: t("campaignsGuide.nextButton", { ns: "us1", defaultValue: "Next" })
      }}
    />
  );
}