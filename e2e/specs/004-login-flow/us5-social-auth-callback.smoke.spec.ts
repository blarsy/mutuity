import { expect, test } from "@playwright/test";

// Spec: specs/012-topela-surface-replatforming
// Stories: US5
// Tags: @smoke @spec-012 @social-auth

test("@smoke @spec-012-social-google registration-required callback redirects to prefilled register", async ({ page }) => {
  await page.goto("/auth/google/callback?status=register_required&email=social.user%40example.com&name=Social%20User");

  await expect(page).toHaveURL(/\/register\?provider=google/);
  await expect(page.getByRole("heading", { name: /create account|creer un compte|créer un compte/i })).toBeVisible();

  const emailInput = page.getByLabel(/email/i);
  await expect(emailInput).toHaveValue("social.user@example.com");

  const displayNameInput = page.getByLabel(/account name|nom du compte/i);
  await expect(displayNameInput).toHaveValue("Social User");
});

test("@smoke @spec-012-social-apple callback error keeps explicit recovery actions visible", async ({ page }) => {
  await page.goto("/auth/apple/callback?error=Provider%20callback%20failed&next=%2Fneeds");

  await expect(page).toHaveURL(/\/auth\/apple\/callback/);
  await expect(page.locator(".MuiAlert-standardError").first()).toContainText(/provider callback failed/i);
  await expect(page.getByRole("link", { name: /back to sign in|retour a la connexion|retour à la connexion/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /complete registration|finaliser l'inscription/i })).toBeVisible();
});
