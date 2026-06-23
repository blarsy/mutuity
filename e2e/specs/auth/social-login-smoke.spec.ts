import { expect, test } from "@playwright/test";

// Spec: specs/013-social-login
// Stories: US1, US2, US3, US4
// Tags: @smoke @spec-013 @social-auth

test("@smoke @spec-013-us1 google register_required callback pre-fills register", async ({ page }) => {
  await page.goto("/auth/google/callback?status=register_required&email=social.user%40example.com&name=Social%20User&providerSubject=google-sub-123");

  await expect(page).toHaveURL(/\/register\?provider=google/);
  await expect(page.getByRole("heading", { name: /create account|creer un compte|créer un compte/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toHaveValue("social.user@example.com");
  await expect(page.getByLabel(/account name|nom du compte/i)).toHaveValue("Social User");
});

test("@smoke @spec-013-us2 google success callback preserves safe next destination", async ({ page }) => {
  await page.goto("/auth/google/callback?status=success&next=%2Fneeds%2Fcreate");

  await expect(page).toHaveURL(/\/login\?next=%2Fneeds%2Fcreate/);
});

test("@smoke @spec-013-us3 apple register_required callback pre-fills register", async ({ page }) => {
  await page.goto("/auth/apple/callback?status=register_required&email=apple.user%40example.com&name=Apple%20User&providerSubject=apple-sub-456");

  await expect(page).toHaveURL(/\/register\?provider=apple/);
  await expect(page.getByRole("heading", { name: /create account|creer un compte|créer un compte/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toHaveValue("apple.user@example.com");
  await expect(page.getByLabel(/account name|nom du compte/i)).toHaveValue("Apple User");
});

test("@smoke @spec-013-us4 apple success callback preserves safe next destination", async ({ page }) => {
  await page.goto("/auth/apple/callback?status=success&next=%2Fcampaigns");

  await expect(page).toHaveURL(/\/login\?next=%2Fcampaigns/);
});

test("@smoke @spec-013-exception link confirmation callback redirects to guarded login", async ({ page }) => {
  await page.goto("/auth/google/callback?status=link_confirmation_required&email=person%40example.com&providerSubject=google-link-sub-1");

  await expect(page).toHaveURL(/\/login\?next=%2F&social_link_required=1&provider=google&email=person%40example.com&providerSubject=google-link-sub-1/);
  await expect(page.getByRole("alert").first()).toContainText(/already exists|compte existant/i);
});
