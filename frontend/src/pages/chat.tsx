import { useTranslation } from "react-i18next";

import { PlaceholderPage } from "../features/layout/PlaceholderPage";

export default function ChatPage() {
  const { t } = useTranslation("layout");

  return (
    <PlaceholderPage
      title={t("nav.chat")}
      description={t("placeholders.chat", { ns: "common" })}
    />
  );
}
