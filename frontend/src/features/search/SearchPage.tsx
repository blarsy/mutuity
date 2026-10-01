import { useRouter } from "next/router";
import type { MouseEvent } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";

import PublicNeedsPage from "../needs/PublicNeedsPage";
import PublicResourcesPage from "../resources/PublicResourcesPage";

export type SearchMode = "resources" | "needs";

export default function SearchPage() {
  const router = useRouter();
  const { t } = useTranslation("layout");

  const mode: SearchMode = router.query.mode === "needs" ? "needs" : "resources";

  const handleModeChange = (_event: MouseEvent<HTMLElement>, nextMode: SearchMode | null) => {
    if (!nextMode || nextMode === mode) {
      return;
    }

    void router.replace(
      { pathname: router.pathname, query: nextMode === "needs" ? { mode: "needs" } : {} },
      undefined,
      { shallow: true }
    );
  };

  const modeToggle = (
    <ToggleButtonGroup
      aria-label={t("search.modeLabel")}
      color="primary"
      exclusive
      onChange={handleModeChange}
      size="small"
      sx={{ mt: 1 }}
      value={mode}
    >
      <ToggleButton value="resources">{t("search.resourcesMode")}</ToggleButton>
      <ToggleButton value="needs">{t("search.needsMode")}</ToggleButton>
    </ToggleButtonGroup>
  );

  return mode === "needs" ? (
    <PublicNeedsPage modeToggle={modeToggle} />
  ) : (
    <PublicResourcesPage modeToggle={modeToggle} />
  );
}
