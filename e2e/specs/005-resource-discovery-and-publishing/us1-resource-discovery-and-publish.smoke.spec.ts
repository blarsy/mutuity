import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CREATOR_IDENTIFIER,
  E2E_PASSWORD,
  E2E_RESOURCE_TITLE
} from "../../helpers/testUsers";

// Spec: specs/005-resource-discovery-and-publishing
// Stories: US1, US2
// Tags: @smoke @spec-005

test("@smoke @spec-005-us1 visitor can discover an active seeded resource", async ({ page }) => {
  await page.goto("/resources");

  await page.getByLabel(/search resources/i).fill(E2E_RESOURCE_TITLE);
  await expect(page.getByText(E2E_RESOURCE_TITLE).first()).toBeVisible();
});

test("@smoke @spec-005-us2 authenticated user can publish a resource and see it in manage workspace", async ({ page }) => {
  const resourceTitle = `E2E Smoke Published Resource ${Date.now()}`;

  await loginViaUi(page, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/resources/manage"
  });

  await expect(page).toHaveURL(/\/resources\/manage(\?.*)?$/);
  await page.locator('a[href="/resources/create"]').click();
  await expect(page).toHaveURL(/\/resources\/create(\?.*)?$/);

  await page.locator('input[name="title"]').fill(resourceTitle);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/resources\/manage(\?.*)?$/);

  await page.goto("/resources");
  await page.locator('input[type="text"]').first().fill(resourceTitle);
  await expect(page.getByText(resourceTitle).first()).toBeVisible();
});
