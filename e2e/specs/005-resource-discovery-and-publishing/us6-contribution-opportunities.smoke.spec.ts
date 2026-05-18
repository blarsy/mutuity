import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/005-resource-discovery-and-publishing
// Story: US6 (contribution opportunities visibility)
// Tags: @smoke @spec-005-us6

test("@smoke @spec-005-us6 authenticated user sees contribution opportunities and key route links", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/contribution"
  });

  await expect(page).toHaveURL(/\/contribution(\?.*)?$/);

  await expect(page.getByRole("heading", { level: 1, name: /contribution/i })).toBeVisible();

  const profileLink = page.locator('a[href="/profile"]').first();
  const resourceCreateLink = page.locator('a[href="/resources/create"]').first();
  const resourceManageLink = page.locator('a[href="/resources/manage"]').first();
  const claimsLink = page.locator('a[href="/claims"]').first();

  await expect(profileLink).toBeVisible();
  await expect(resourceCreateLink).toBeVisible();
  await expect(resourceManageLink).toBeVisible();
  await expect(claimsLink).toBeVisible();

  await resourceManageLink.click();
  await expect(page).toHaveURL(/\/resources\/manage(\?.*)?$/);
});
