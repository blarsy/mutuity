import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { E2E_CLAIMER_IDENTIFIER, E2E_PASSWORD } from "../../helpers/testUsers";

// Spec: specs/011-account-deletion-anonymization
// Story: US1 (profile delete action guard and confirmation contract)
// Tags: @smoke @spec-011-us1

test("@smoke @spec-011-us1 delete confirmation requires explicit guard and supports cancel", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/profile"
  });

  const deleteButton = page.getByRole("button", { name: /delete account|supprimer votre compte|supprimer mon compte|supprimer le compte/i });
  await deleteButton.scrollIntoViewIfNeeded();
  await expect(deleteButton).toBeVisible();

  await deleteButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const confirmDelete = page.getByRole("button", { name: /yes, delete my account|oui, supprimer mon compte/i });
  await expect(confirmDelete).toBeDisabled();

  await page.getByRole("checkbox").check();
  await expect(confirmDelete).toBeEnabled();

  await page.getByRole("button", { name: /cancel|annuler/i }).click();
  await expect(dialog).not.toBeVisible();
});
