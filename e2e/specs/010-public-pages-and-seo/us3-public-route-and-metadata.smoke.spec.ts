import { expect, test } from "@playwright/test";
import { E2E_NEED_ID } from "../../helpers/testUsers";

// Spec: specs/010-public-pages-and-seo
// Story: US3 (public route availability, hidden handling, SSR metadata)
// Tags: @smoke @spec-010-us3

test("@smoke @spec-010-us3 visible public routes render core content", async ({ page }) => {
  await page.goto(`/needs/${E2E_NEED_ID}`);
  await expect(page.getByRole("heading", { name: /need details|details du besoin|détails du besoin/i })).toBeVisible();

  await page.goto("/campaigns");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/accounts/account-001");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("@smoke @spec-010-us3 hidden or unknown entities return not-found behavior", async ({ page }) => {
  const missingNeed = await page.request.get("/needs/00000000-0000-0000-0000-000000000000", {
    failOnStatusCode: false
  });
  expect(missingNeed.status()).toBe(404);

  const missingCampaign = await page.request.get("/campaigns/00000000-0000-0000-0000-000000000000", {
    failOnStatusCode: false
  });
  expect(missingCampaign.status()).toBe(404);

  await page.goto("/accounts/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText(/account is not publicly available|compte n'est pas publiquement accessible/i)).toBeVisible();
});

test("@smoke @spec-010-us3 public pages include server-rendered SEO metadata", async ({ page }) => {
  const cases = [
    { path: `/needs/${E2E_NEED_ID}`, canonicalPath: "/needs/" },
    { path: "/accounts/account-001", canonicalPath: "/accounts/account-001" }
  ];

  for (const item of cases) {
    await page.goto(item.path);

    const title = await page.locator("head title").textContent();
    const description = await page.locator('head meta[name="description"]').getAttribute("content");
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute("href");

    expect(title?.trim().length).toBeGreaterThan(0);
    expect(description?.trim().length).toBeGreaterThan(0);
    expect(canonical).toContain(item.canonicalPath);
  }
});
