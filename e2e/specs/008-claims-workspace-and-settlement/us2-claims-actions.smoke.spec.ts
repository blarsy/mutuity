import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_ACTION_NEED_TITLE,
  E2E_CLAIMER_IDENTIFIER,
  E2E_PASSWORD
} from "../../helpers/testUsers";

// Spec: specs/008-claims-workspace-and-settlement
// Story: US2 (claimer can manage an open sent claim)
// Tags: @smoke @spec-008-us2

test("@smoke @spec-008-us2 claimer can cancel a seeded sent claim", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/claims"
  });

  const claimCard = page.locator('[data-testid="need-card"]').filter({ has: page.getByText(E2E_ACTION_NEED_TITLE) }).first();
  const cancelAction = claimCard.getByRole("button", { name: /^(Cancel claim|Annuler la demande|Retirer la proposition)$/i });

  await expect(claimCard).toBeVisible();
  await cancelAction.click();
  await expect(claimCard).not.toBeVisible();

  await page.getByRole("button", { name: /Inactive|Inactives/i }).first().click();
  await expect(claimCard).toBeVisible();
  await expect(claimCard.getByText(/Cancelled on|Annulée le/i)).toBeVisible();
});
