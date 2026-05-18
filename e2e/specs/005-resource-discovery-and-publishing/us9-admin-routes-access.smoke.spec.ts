import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/005-resource-discovery-and-publishing
// Story: US9 (admin routes access control)
// Tags: @smoke @spec-005-us9

test("@smoke @spec-005-us9 visitor is redirected to login when accessing admin routes", async ({ page }) => {
  const adminSections = ["accounts", "bids", "resources", "grants", "logs"];

  for (const section of adminSections) {
    await page.goto(`/admin/${section}`);
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2F/);
  }
});

test("@smoke @spec-005-us9 authenticated user can navigate to admin pages", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/admin/accounts"
  });

  await expect(page).toHaveURL(/\/admin\/accounts(\?.*)?$/);

  const heading = page.locator('h1, [role="heading"]').first();
  await expect(heading).toBeVisible();
});
