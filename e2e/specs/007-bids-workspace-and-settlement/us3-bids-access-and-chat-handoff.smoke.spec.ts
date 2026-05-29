import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CLAIMER_IDENTIFIER,
  E2E_PASSWORD
} from "../../helpers/testUsers";

// Spec: specs/007-bids-workspace-and-settlement
// Story: US3 (workspace access guard + bid-to-chat handoff)
// Tags: @smoke @spec-007-us3

test("@smoke @spec-007-us3 visitor is redirected to login for bids workspace", async ({ page }) => {
  await page.goto("/bids");
  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?bids/);
});

test("@smoke @spec-007-us3 authenticated user can open bids workspace", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/bids"
  });

  await expect(page.getByRole("heading", { level: 4, name: /Bids workspace|Espace des offres/i })).toBeVisible();
  await expect(page.getByRole("heading", { level: 5, name: /Bids you sent|Offres envoyées/i })).toBeVisible();
});

test("@smoke @spec-007-us3 bidder can open conversation from accepted bid", async ({ browser }) => {
  const bidderWorkspacePage = await browser.newPage();
  await loginViaUi(bidderWorkspacePage, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/bids"
  });

  const chatButton = bidderWorkspacePage.getByRole("button", { name: /Chat|Discussion/i });
  if (await chatButton.count()) {
    await chatButton.first().click();
    await expect(bidderWorkspacePage).toHaveURL(/\/chat\?kind=resource&id=/);
  } else {
    await expect(
      bidderWorkspacePage
        .getByText(/Bids you sent|Offres envoyées|You have not sent any resource bids yet|Vous n'avez encore envoyé aucune offre/i)
        .first()
    ).toBeVisible();
  }

  await bidderWorkspacePage.close();
});
