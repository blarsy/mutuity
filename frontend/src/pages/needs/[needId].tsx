import NextLink from "next/link";
import { useRouter } from "next/router";
import { Button, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../features/auth/AuthProvider";
import { StartConversationDialog } from "../../features/chat/StartConversationDialog";
import { PlaceholderPage } from "../../features/layout/PlaceholderPage";

export default function NeedDetailsPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { t } = useTranslation("needs");
  const needId = typeof router.query.needId === "string" ? router.query.needId : null;
  const displayNeedId = needId ?? t("page.thisNeed");

  return (
    <PlaceholderPage
      title={t("page.detailTitle")}
      description={t("page.detailDescription", { needId: displayNeedId })}
    >
      <Stack alignItems={{ xs: "stretch", sm: "flex-start" }} spacing={1}>
        {session.authenticated && needId ? (
          <StartConversationDialog
            buttonLabel={t("page.contactCreator")}
            kind="need"
            needId={needId}
            title={t("page.detailTitle")}
          />
        ) : (
          <Button
            component={NextLink}
            href={needId ? `/login?next=%2Fneeds%2F${needId}` : "/login"}
            variant="contained"
          >
            {t("page.signInToContact", { ns: "needs" })}
          </Button>
        )}
      </Stack>
    </PlaceholderPage>
  );
}
