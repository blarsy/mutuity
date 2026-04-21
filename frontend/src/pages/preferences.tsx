import { useTranslation } from "react-i18next";

import { PlaceholderPage } from "../features/layout/PlaceholderPage";

export default function PreferencesPage() {
  const { t } = useTranslation("layout");

  return (
    <PlaceholderPage
      title={t("menu.preferences")}
      description={t("placeholders.preferences", { ns: "common" })}
    />
  );
}
