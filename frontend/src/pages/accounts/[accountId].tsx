import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function AccountDetailsPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const accountId = typeof router.query.accountId === "string" ? router.query.accountId : t("placeholders.thisAccount");

  return (
    <PlaceholderPage
      title={t("placeholders.accountDetailsTitle")}
      description={t("placeholders.accountDetailsDescription", { accountId })}
    />
  );
}
