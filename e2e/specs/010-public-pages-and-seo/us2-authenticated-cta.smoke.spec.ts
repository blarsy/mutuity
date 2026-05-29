import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_NEED_ID, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/010-public-pages-and-seo
// Story: US2 (need detail page - authenticated user conversation CTA)
// Tags: @smoke @spec-010-us2

test("@smoke @spec-010-us2 authenticated non-owner sees conversation CTA on need detail page", async ({
  page
}) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: `/needs/${E2E_NEED_ID}`
  });

  await expect(page).toHaveURL(/\/needs\//);

  const conversationButton = page.getByRole("button", {
    name: /message creator|ecrire au createur|écrire au créateur/i
  });
  await expect(conversationButton).toBeVisible();
});

test("@smoke @spec-010-us2 authenticated user clicking conversation CTA opens draft/existing thread dialog", async ({
  page
}) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: `/needs/${E2E_NEED_ID}`
  });

  const conversationButton = page.getByRole("button", {
    name: /message creator|ecrire au createur|écrire au créateur/i
  });
  await expect(conversationButton).toBeVisible();
  await conversationButton.click();

  await expect(page).toHaveURL(/\/chat\?kind=need&(id=|draft=1&contextId=)/);
});
