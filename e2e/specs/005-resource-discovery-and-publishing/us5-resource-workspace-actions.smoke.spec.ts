import { expect, test } from "@playwright/test";

// Spec: specs/005-resource-discovery-and-publishing
// Story: US5 (resource workspace routes are protected)
// Tags: @smoke @spec-005-us5

test("@smoke @spec-005-us5 visitor is redirected to login when opening workspace routes", async ({ page }) => {
  await page.goto("/resources/manage");
  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?resources%2Fmanage/);

  await page.goto("/resources/create");
  await expect(page).toHaveURL(/\/login\?next=%2F(?:app%2F)?resources%2Fcreate/);
});
