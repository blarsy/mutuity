import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CLAIMER_IDENTIFIER,
  E2E_CREATOR_IDENTIFIER,
  E2E_DECLINE_RESOURCE_ID,
  E2E_DECLINE_RESOURCE_TITLE,
  E2E_PASSWORD
} from "../../helpers/testUsers";

// Spec: specs/007-bids-workspace-and-settlement
// Story: US2 (bid decline + refund lifecycle branch)
// Tags: @smoke @spec-007-us2

test("@smoke @spec-007-us2 bidder sees declined state after creator declines bid", async ({ browser }) => {
  const bidderPage = await browser.newPage();

  await loginViaUi(bidderPage, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: `/resources/${E2E_DECLINE_RESOURCE_ID}`
  });

  await expect(bidderPage.getByText(E2E_DECLINE_RESOURCE_TITLE).first()).toBeVisible();

  await bidderPage.getByRole("button", { name: /Make a bid|Update your bid|Make a new bid|Faire une offre|offre/i }).click();

  const bidDialog = bidderPage.getByRole("dialog");
  await expect(bidDialog).toBeVisible();
  await bidDialog.getByRole("textbox").first().fill("E2E smoke decline bid message");
  await bidDialog.getByRole("button", { name: /Send bid|Save bid|Envoyer|Enregistrer/i }).click();

  await bidderPage.goto("/bids");
  await expect(bidderPage).toHaveURL(/\/bids/);
  await bidderPage.close();

  const ownerPage = await browser.newPage();

  await loginViaUi(ownerPage, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/bids"
  });

  const receivedBidCard = ownerPage.locator('div[id^="bid-"]').filter({ hasText: E2E_DECLINE_RESOURCE_TITLE }).first();

  await expect(receivedBidCard).toBeVisible();
  await receivedBidCard.getByRole("button", { name: /Decline bid|Refuser l'offre/i }).click();
  await expect(receivedBidCard.getByRole("button", { name: /Decline bid|Refuser l'offre/i })).not.toBeVisible();

  await ownerPage.close();

  const bidderBidsPage = await browser.newPage();

  await loginViaUi(bidderBidsPage, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/bids"
  });

  const sentBidCard = bidderBidsPage.locator('div[id^="bid-"]').filter({ hasText: E2E_DECLINE_RESOURCE_TITLE }).first();

  await expect(sentBidCard).toBeVisible();
  await expect(sentBidCard.getByText(/This bid was declined|Cette offre a été refusée/i)).toBeVisible();

  await bidderBidsPage.close();
});
