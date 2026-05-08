import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CLAIMER_IDENTIFIER,
  E2E_CREATOR_IDENTIFIER,
  E2E_NEED_TITLE,
  E2E_PASSWORD
} from "../../helpers/testUsers";

// Spec: specs/008-claims-workspace-and-settlement
// Story: US1 (browse sent and received claims)
// Tags: @smoke @spec-008-us1

test("@smoke @spec-008-us1 claimer sees seeded claim in sent workspace", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/claims"
  });

  await expect(page.getByText(E2E_NEED_TITLE).first()).toBeVisible();
});

test("@smoke @spec-008-us1 creator sees seeded claim in received workspace", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/claims"
  });

  await expect(page.getByText(E2E_NEED_TITLE).first()).toBeVisible();
});
