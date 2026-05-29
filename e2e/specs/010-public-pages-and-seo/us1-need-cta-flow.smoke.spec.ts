import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_NEED_ID, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/010-public-pages-and-seo
// Story: US1 (need detail page - guest and authenticated CTA flows)
// Tags: @smoke @spec-010-us1

test("@smoke @spec-010-us1 guest on need detail page sees login CTA with encoded return URL", async ({ page }) => {
  // Navigate to a need detail page as guest
  await page.goto(`/needs/${E2E_NEED_ID}`);
  
  // Find the login CTA button (guest users see this)
  const loginButton = page.getByRole("link", {
    name: /sign in to message the creator|se connecter pour ecrire au createur|se connecter pour écrire au créateur/i
  });
  await expect(loginButton).toBeVisible();
  
  // Verify the href contains proper return URL encoding (/needs/need-001 → %2Fneeds%2Fneed-001)
  const href = await loginButton.getAttribute("href");
  expect(href).toMatch(/^\/login\?next=%2F(?:app%2F)?needs%2F/);
});

test("@smoke @spec-010-us1 guest clicking need CTA navigates to login with return URL", async ({ page }) => {
  await page.goto(`/needs/${E2E_NEED_ID}`);
  
  const loginButton = page.getByRole("link", {
    name: /sign in to message the creator|se connecter pour ecrire au createur|se connecter pour écrire au créateur/i
  });
  await loginButton.click();
  
  // Verify redirected to login page with return URL in query params
  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?needs%2F/);
});

test("@smoke @spec-010-us1 campaign page has no direct contact CTA", async ({ page }) => {
  // Navigate to public campaigns page
  await page.goto("/campaigns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  
  // Verify no "contact creator" or "sign in to contact" buttons exist
  const contactButton = page.getByRole("button", { name: /contact creator|sign in to contact|connect to contact/i });
  await expect(contactButton).not.toBeVisible();
});

test("@smoke @spec-010-us1 account page has no direct contact CTA", async ({ page }) => {
  // Navigate to account public profile page
  await page.goto("/accounts/account-001");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  
  // Verify no "contact" or "sign in" buttons exist
  const contactButton = page.getByRole("button", { name: /contact creator|sign in to contact|connect to contact/i });
  await expect(contactButton).not.toBeVisible();
});
