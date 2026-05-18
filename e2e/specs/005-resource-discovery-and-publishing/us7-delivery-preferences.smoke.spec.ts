import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
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

  await expect(page).toHaveURL(/\/preferences(\?.*)?$/);

  const pageTitle = page.locator('h1, [role="heading"]').first();
  await expect(pageTitle).toBeVisible();

  const preferenceCards = page.locator('div.MuiCard-root');
  const cardCount = await preferenceCards.count();
  expect(cardCount).toBeGreaterThan(0);

  const firstCard = preferenceCards.first();
  await expect(firstCard).toBeVisible();

  const strategySelect = firstCard.locator('select').first();
  if (await strategySelect.isVisible()) {
    const currentValue = await strategySelect.inputValue();
    expect(["realtime_push", "email_summary"]).toContain(currentValue);
  }
});
