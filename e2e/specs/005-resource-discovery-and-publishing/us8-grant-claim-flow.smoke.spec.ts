import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/005-resource-discovery-and-publishing
// Story: US8 (grants access and claim UX baseline)
// Tags: @smoke @spec-005-us8

test("@smoke @spec-005-us8 authenticated user is redirected to login when accessing a grant route unauthenticated", async ({ page }) => {
  const grantId = "12345678-1234-5678-1234-567812345678";
  
  await page.goto(`/grants/${grantId}`);
  
  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?grants%2F/);
});

test("@smoke @spec-005-us8 authenticated user can navigate to a grant claim page", async ({ page }) => {
  const grantId = "12345678-1234-5678-1234-567812345678";

  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: `/grants/${grantId}`
  });

  await expect(page).toHaveURL(/\/grants\/[a-f0-9-]+(\?.*)?$/);
});
