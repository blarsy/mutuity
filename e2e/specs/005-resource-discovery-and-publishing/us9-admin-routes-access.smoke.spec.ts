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
    await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?admin%2F/);
  }
});

test("@smoke @spec-005-us9 authenticated non-admin user is denied admin pages", async ({ page }) => {
  await page.goto("/login?next=%2Fadmin%2Faccounts");
  await page.locator('input[name="identifier"]').fill(E2E_CLAIMER_IDENTIFIER);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/(app|login|$)/);
  await expect(page).not.toHaveURL(/\/admin\/accounts/);
});
