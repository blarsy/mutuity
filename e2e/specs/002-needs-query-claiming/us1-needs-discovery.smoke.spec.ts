import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_NEED_TITLE, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/002-needs-query-claiming
// Story: US1 (discover active needs)
// Tags: @smoke @spec-002-us1

test("@smoke @spec-002-us1 claimer can sign in and see active seeded need on /needs", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/needs"
  });

  // Narrow results to the deterministic seeded need title.
  await page.getByLabel(/search needs|rechercher des besoins/i).fill(E2E_NEED_TITLE);
  await expect(page.getByText(E2E_NEED_TITLE).first()).toBeVisible();
});
