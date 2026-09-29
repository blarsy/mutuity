import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ExplainerDialog } from "../explainer/ExplainerDialog";
import { buildTokenExplainerSlides } from "../../features/tokenExplainer";

export interface TokenExplainerDialogProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

export function TokenExplainerDialog({
  visible,
  onClose,
  testID
}: TokenExplainerDialogProps): React.JSX.Element | null {
  const { t } = useTranslation("us1");

  const slides = useMemo(() => buildTokenExplainerSlides((key) => t(key, { defaultValue: key })), [t]);

  return (
    <ExplainerDialog
      visible={visible}
      onClose={onClose}
      testID={testID}
      title={t("topesGuide.title", { ns: "us1", defaultValue: "Topes guide" })}
      slides={slides}
      labels={{
        stepLabel: t("topesGuide.stepLabel", {
          ns: "us1",
          defaultValue: "Step {{current}} of {{total}}"
        }),
        close: t("topesGuide.closeButton", { ns: "us1", defaultValue: "Close" }),
        previous: t("topesGuide.previousButton", { ns: "us1", defaultValue: "Previous" }),
        next: t("topesGuide.nextButton", { ns: "us1", defaultValue: "Next" })
      }}
    />
  );
}
