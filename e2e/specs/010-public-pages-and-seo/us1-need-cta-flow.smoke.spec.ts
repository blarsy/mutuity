import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_NEED_TITLE, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/010-public-pages-and-seo
// Story: US1 (need detail page - guest and authenticated CTA flows)
// Tags: @smoke @spec-010-us1

test("@smoke @spec-010-us1 guest on need detail page sees login CTA with encoded return URL", async ({ page }) => {
  // Navigate to a need detail page as guest
  // Note: This uses a deterministic need ID from seeded data
  await page.goto("/needs/need-001");
  
  // Find the login CTA button (guest users see this)
  const loginButton = page.getByRole("button", { name: /sign in to contact/i });
  await expect(loginButton).toBeVisible();
  
  // Verify the href contains proper return URL encoding (/needs/need-001 → %2Fneeds%2Fneed-001)
  const href = await loginButton.getAttribute("href");
  expect(href).toBe("/login?next=%2Fneeds%2Fneed-001");
});

test("@smoke @spec-010-us1 guest clicking need CTA navigates to login with return URL", async ({ page }) => {
  await page.goto("/needs/need-001");
  
  const loginButton = page.getByRole("button", { name: /sign in to contact/i });
  await loginButton.click();
  
  // Verify redirected to login page with return URL in query params
  await expect(page).toHaveURL(/\/login\?next=%2Fneeds%2F/);
});

test("@smoke @spec-010-us1 campaign page has no direct contact CTA", async ({ page }) => {
  // Navigate to campaign detail page
  await page.goto("/campaigns/campaign-001");
  
  // Verify no "contact creator" or "sign in to contact" buttons exist
  const contactButton = page.getByRole("button", { name: /contact|sign in/i });
  await expect(contactButton).not.toBeVisible();
});

test("@smoke @spec-010-us1 account page has no direct contact CTA", async ({ page }) => {
  // Navigate to account public profile page
  await page.goto("/accounts/account-001");
  
  // Verify no "contact" or "sign in" buttons exist
  const contactButton = page.getByRole("button", { name: /contact|sign in/i });
  await expect(contactButton).not.toBeVisible();
});
