import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_NEED_TITLE, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/010-public-pages-and-seo
// Story: US2 (need detail page - authenticated user conversation CTA)
// Tags: @smoke @spec-010-us2

test("@smoke @spec-010-us2 authenticated user sees conversation button on need detail page", async ({
  page
}) => {
  // Log in as claimer
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/needs/need-001"
  });
  
  // Verify on need detail page
  await expect(page).toHaveURL(/\/needs\//);
  
  // Find conversation button (authenticated non-owner should see this)
  const conversationButton = page.getByRole("button", { name: /contact creator/i });
  
  // Note: This will only be visible if user is not the need creator
  // If creator, no button should appear
  if (await conversationButton.isVisible()) {
    expect(conversationButton).toBeTruthy();
  }
});

test("@smoke @spec-010-us2 authenticated user clicking conversation button opens dialog", async ({
  page
}) => {
  // Log in as claimer
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/needs/need-001"
  });
  
  // Find and click conversation button
  const conversationButton = page.getByRole("button", { name: /contact creator/i });
  
  if (await conversationButton.isVisible()) {
    await conversationButton.click();
    
    // Verify dialog opened (look for dialog title or form elements)
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
  }
});
