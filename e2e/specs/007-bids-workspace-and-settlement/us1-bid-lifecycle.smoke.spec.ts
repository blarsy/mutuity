import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import { urlRegexForPath } from "../../helpers/routes";
import {
  E2E_CLAIMER_IDENTIFIER,
  E2E_CREATOR_IDENTIFIER,
  E2E_PASSWORD,
  E2E_RESOURCE_ID,
  E2E_RESOURCE_TITLE
} from "../../helpers/testUsers";

// Spec: specs/007-bids-workspace-and-settlement
// Story: US1 (create and review a resource bid)
// Tags: @smoke @spec-007-us1

test("@smoke @spec-007-us1 claimer creates a bid and creator accepts it", async ({ browser }) => {
  const bidderPage = await browser.newPage();

  await loginViaUi(bidderPage, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: `/resources/${E2E_RESOURCE_ID}`
  });

  await expect(bidderPage.getByText(E2E_RESOURCE_TITLE).first()).toBeVisible();

  await bidderPage.getByRole("button", { name: /Make a bid|Update your bid|Make a new bid|Faire une offre|offre/i }).click();

  const bidDialog = bidderPage.getByRole("dialog");
  await expect(bidDialog).toBeVisible();
  await bidDialog.getByRole("textbox", { name: /optional message|message optionnel/i }).fill("E2E smoke bid message");
  await bidDialog.getByRole("button", { name: /Send bid|Save bid|Envoyer|Enregistrer/i }).click();

  await bidderPage.goto("/app/bids");
  await expect(bidderPage).toHaveURL(urlRegexForPath("/bids"));

  await bidderPage.close();

  const ownerPage = await browser.newPage();

  await loginViaUi(ownerPage, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/bids"
  });

  const receivedBidCard = ownerPage.locator('div[id^="bid-"]').filter({ hasText: E2E_RESOURCE_TITLE }).first();

  await expect(receivedBidCard).toBeVisible();
  await receivedBidCard.getByRole("button", { name: /Accept bid|Accepter/i }).click();
  await ownerPage.getByRole("button", { name: /Yes, accept|Oui, accepter|accepter/i }).click();

  await expect(receivedBidCard.getByRole("button", { name: /Accept bid|Accepter/i })).not.toBeVisible();

  await ownerPage.close();
});
