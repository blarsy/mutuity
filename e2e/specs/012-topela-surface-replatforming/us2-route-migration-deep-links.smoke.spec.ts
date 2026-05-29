import { expect, test } from "@playwright/test";

// Spec: specs/012-topela-surface-replatforming
// Stories: Milestone I (T012-041)
// Tags: @smoke @spec-012 @route-migration

const LEGACY_TO_APP_LOGIN_EXPECTATIONS = [
  {
    legacyPath: "/profile",
    expectedNext: "%2Fapp%2Fprofile"
  },
  {
    legacyPath: "/contribution",
    expectedNext: "%2Fapp%2Fcontribution"
  },
  {
    legacyPath: "/resources/manage",
    expectedNext: "%2Fapp%2Fresources%2Fmanage"
  }
] as const;

test("@smoke @spec-012-us2 legacy deep links preserve destination under /app after redirect", async ({ page }) => {
  for (const item of LEGACY_TO_APP_LOGIN_EXPECTATIONS) {
    await page.goto(item.legacyPath);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${item.expectedNext}`));
  }
});
