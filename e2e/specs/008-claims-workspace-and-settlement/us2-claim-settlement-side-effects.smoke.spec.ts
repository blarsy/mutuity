import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CLAIMER_IDENTIFIER,
  E2E_CREATOR_IDENTIFIER,
  E2E_PASSWORD,
  E2E_SECOND_CLAIMER_IDENTIFIER,
  E2E_SETTLEMENT_NEED_TITLE
} from "../../helpers/testUsers";

// Spec: specs/008-claims-workspace-and-settlement
// Story: US2 (settlement side-effects)
// Tags: @smoke @spec-008-us2-settle

test("@smoke @spec-008-us2-settle settling one claim auto-declines sibling claim", async ({ browser }) => {
  const creatorPage = await browser.newPage();

  await loginViaUi(creatorPage, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/claims"
  });

  const receivedClaimCard = creatorPage.locator('[data-testid="need-card"]')
    .filter({ hasText: E2E_SETTLEMENT_NEED_TITLE })
    .filter({ hasText: "E2E settlement primary smoke claim message" })
    .first();
  const settleAction = receivedClaimCard.getByRole("button", { name: /^(Settle|Clôturer)$/i });

  await expect(receivedClaimCard).toBeVisible();
  await settleAction.click();

  const settleDialog = creatorPage.getByRole("dialog");
  await expect(settleDialog).toBeVisible();
  await settleDialog.getByRole("button", { name: /Settle|Clôturer/i }).click();

  await expect(settleAction).not.toBeVisible();

  await creatorPage.close();

  const siblingClaimerPage = await browser.newPage();

  await loginViaUi(siblingClaimerPage, {
    identifier: E2E_SECOND_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/claims"
  });

  await siblingClaimerPage.getByRole("button", { name: /All|Toutes/i }).first().click();

  const siblingClaimCard = siblingClaimerPage.locator('[data-testid="need-card"]')
    .filter({ hasText: E2E_SETTLEMENT_NEED_TITLE })
    .filter({ hasText: "E2E settlement sibling smoke claim message" })
    .first();

  await expect(siblingClaimCard).toBeVisible();
  await expect(siblingClaimCard.getByText(/Declined on|Refusée le/i)).toBeVisible();

  await siblingClaimerPage.close();

  const primaryClaimerPage = await browser.newPage();

  await loginViaUi(primaryClaimerPage, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/claims"
  });

  await primaryClaimerPage.getByRole("button", { name: /All|Toutes/i }).first().click();

  const settledClaimCard = primaryClaimerPage.locator('[data-testid="need-card"]')
    .filter({ hasText: E2E_SETTLEMENT_NEED_TITLE })
    .filter({ hasText: "E2E settlement primary smoke claim message" })
    .first();

  await expect(settledClaimCard).toBeVisible();
  await expect(settledClaimCard.getByText(/Settled on|Clôturée le|Cloturée le/i)).toBeVisible();

  await primaryClaimerPage.close();
});
