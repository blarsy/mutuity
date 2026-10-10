import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { ExplainerDialog } from "../explainer/ExplainerDialog";
import { buildTokenExplainerSlides } from "../../features/contribution/tokenExplainer";

export interface TokenExplainerDialogProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

/** Web-compatible port of the mobile TokenExplainerDialog wrapper. */
export function TokenExplainerDialog({ visible, onClose, testID }: TokenExplainerDialogProps) {
  const { t } = useTranslation("contribution");
  const slides = useMemo(() => buildTokenExplainerSlides(key => t(key, { defaultValue: key })), [t]);

  return (
    <ExplainerDialog
      visible={visible}
      onClose={onClose}
      testID={testID}
      title={t("topesGuide.title", { defaultValue: "Topes guide" })}
      slides={slides}
      labels={{
        stepLabel: t("topesGuide.stepLabel", { defaultValue: "Step {{current}} of {{total}}" }),
        close: t("topesGuide.closeButton", { defaultValue: "Close" }),
        previous: t("topesGuide.previousButton", { defaultValue: "Previous" }),
        next: t("topesGuide.nextButton", { defaultValue: "Next" })
      }}
    />
  );
}