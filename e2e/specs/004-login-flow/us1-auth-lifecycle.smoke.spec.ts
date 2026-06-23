import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { urlRegexForPath } from "../../helpers/routes";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/004-login-flow
// Stories: US1, US2, US3, US4
// Tags: @smoke @spec-004

test("@smoke @spec-004-us2 signed-out user is redirected to login and returned to protected page", async ({ page }) => {
  await page.goto("/profile");

  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?profile/);

  await page.locator('input[name="identifier"]').fill(E2E_CLAIMER_IDENTIFIER);
  await page.locator('input[name="password"]').fill(E2E_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(urlRegexForPath("/profile"));
});

test("@smoke @spec-004-us1 invalid credentials are rejected", async ({ page }) => {
  await page.goto("/login");

  await page.locator('input[name="identifier"]').fill(E2E_CLAIMER_IDENTIFIER);
  await page.locator('input[name="password"]').fill("not-the-right-password");
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("alert").first()).toBeVisible();
});

test("@smoke @spec-004-us3 authenticated session persists across refresh", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/needs"
  });

  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page).toHaveURL(urlRegexForPath("/needs"));
});

test("@smoke @spec-004-us4 signed-in user can log out and protected pages require login again", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/profile"
  });

  await page.getByRole("button", { name: /open profile menu|ouvrir le menu profil/i }).click();
  await page.getByRole("menuitem", { name: /log out|se déconnecter|se deconnecter/i }).click();

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?profile/);
});
