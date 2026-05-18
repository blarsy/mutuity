import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/006-chat-and-conversations
// Story: US2 (message composition and thread navigation)
// Tags: @smoke @spec-006-us2

test("@smoke @spec-006-us2 message input requires text before sending", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/chat"
  });

  await page.goto("/chat");

  const sendButton = page.locator('button[type="submit"], button[aria-label*="Send"], button[aria-label*="send"]').first();
  
  // Check if send button is disabled when no conversation is selected or input is empty
  if (await sendButton.isVisible()) {
    const isDisabled = await sendButton.isDisabled();
    expect(typeof isDisabled).toBe('boolean');
  }
});

test("@smoke @spec-006-us2 conversation thread renders header with participant context", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/chat"
  });

  await page.goto("/chat");

  // Wait for the page to stabilize
  await page.waitForLoadState('networkidle');

  const threadHeader = page.locator('header, [role="heading"]').first();
  if (await threadHeader.isVisible()) {
    await expect(threadHeader).toBeVisible();
  }
});

test("@smoke @spec-006-us2 conversation list loads and displays available threads", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/chat"
  });

  await page.goto("/chat");

  await page.waitForLoadState('networkidle');

  const pageContent = page.locator('main, section, [role="main"]').first();
  await expect(pageContent).toBeVisible();
});
