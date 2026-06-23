import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CLAIMER_IDENTIFIER,
  E2E_NEED_TITLE,
  E2E_PASSWORD,
  E2E_RESOURCE_TITLE
} from "../../helpers/testUsers";

// Spec: specs/009-listing-visual-identity
// Story: US1 (listing header identity strip consistency)
// Tags: @smoke @spec-009-us1

async function getListingCardByTitle(page: Parameters<typeof test>[0]["page"], title: string) {
  return page.locator('[data-testid="resource-card"], [data-testid="need-card"]').filter({ hasText: title }).first();
}

test("@smoke @spec-009-us1 needs and resources render a consistent listing header strip", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/resources"
  });

  await page.getByLabel(/search resources|rechercher des ressources/i).fill(E2E_RESOURCE_TITLE);
  const resourceCard = await getListingCardByTitle(page, E2E_RESOURCE_TITLE);
  await expect(resourceCard).toBeVisible();
  await expect(resourceCard.getByText(/Expires|Expire/i).first()).toBeVisible();

  await page.goto("/needs");
  await page.getByLabel(/search needs|rechercher des besoins/i).fill(E2E_NEED_TITLE);
  const needCard = await getListingCardByTitle(page, E2E_NEED_TITLE);
  await expect(needCard).toBeVisible();
  await expect(needCard.getByText(/Expires|Expire/i).first()).toBeVisible();
});

test("@smoke @spec-009-us1 listing cards do not render broken thumbnail images", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CLAIMER_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/resources"
  });

  await page.getByLabel(/search resources|rechercher des ressources/i).fill(E2E_RESOURCE_TITLE);
  const resourceCard = await getListingCardByTitle(page, E2E_RESOURCE_TITLE);
  await expect(resourceCard).toBeVisible();

  const resourceBrokenImageCount = await resourceCard.locator("img").evaluateAll(images =>
    images.filter(image => {
      const src = image.getAttribute("src");
      return src == null || src.trim().length === 0;
    }).length
  );
  expect(resourceBrokenImageCount).toBe(0);

  await page.goto("/needs");
  await page.getByLabel(/search needs|rechercher des besoins/i).fill(E2E_NEED_TITLE);
  const needCard = await getListingCardByTitle(page, E2E_NEED_TITLE);
  await expect(needCard).toBeVisible();

  const needBrokenImageCount = await needCard.locator("img").evaluateAll(images =>
    images.filter(image => {
      const src = image.getAttribute("src");
      return src == null || src.trim().length === 0;
    }).length
  );
  expect(needBrokenImageCount).toBe(0);

  const needHasThumbnailFallbackText = await needCard.getByText(/No image|Pas encore d'image/i).count();
  const needHasImage = await needCard.locator("img").count();
  expect(needHasImage > 0 || needHasThumbnailFallbackText > 0).toBeTruthy();
});
