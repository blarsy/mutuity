import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";

import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function NeedDetailsPage() {
  const router = useRouter();
  const { t } = useTranslation("needs");
  const needId = typeof router.query.needId === "string" ? router.query.needId : "this need";

  return (
    <PlaceholderPage
      title={t("page.detailTitle")}
      description={t("page.detailDescription", { needId })}
    />
  );
}
