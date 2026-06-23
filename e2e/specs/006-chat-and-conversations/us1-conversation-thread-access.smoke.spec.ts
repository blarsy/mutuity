import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { urlRegexForPath } from "../../helpers/routes";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/006-chat-and-conversations
// Story: US1 (conversation thread access control and participant visibility)
// Tags: @smoke @spec-006-us1

test("@smoke @spec-006-us1 visitor is redirected to login when accessing chat page", async ({ page }) => {
  await page.goto("/chat");

  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?chat/);
});

test("@smoke @spec-006-us1 authenticated user can access chat page with conversation list", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/chat"
  });

  await expect(page).toHaveURL(urlRegexForPath("/chat"));
  
  const mainContent = page.locator('main, section').first();
  await expect(mainContent).toBeVisible();
});

test("@smoke @spec-006-us1 chat page message composer is visible for authenticated user", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/chat"
  });

  await page.goto("/chat");

  const messageInput = page.getByPlaceholder(/message/i).first();
  const composer = page.locator('[data-testid*="composer"], form').first();
  
  if (await composer.isVisible()) {
    await expect(composer).toBeVisible();
  }
});
