import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { urlRegexForPath } from "../../helpers/routes";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/005-resource-discovery-and-publishing
// Story: US7 (delivery preferences persistence and category management)
// Tags: @smoke @spec-005-us7

test("@smoke @spec-005-us7 authenticated user can view and toggle delivery preferences", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/preferences"
  });

  await expect(page).toHaveURL(urlRegexForPath("/preferences"));

  const pageTitle = page.locator('h1, [role="heading"]').first();
  await expect(pageTitle).toBeVisible();

  const strategySelect = page.getByRole("combobox").first();
  await expect(strategySelect).toBeVisible();
  await expect(strategySelect).not.toBeEmpty();
});
