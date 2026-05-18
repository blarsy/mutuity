import { expect, test } from "@playwright/test";

// Spec: specs/010-public-pages-and-seo
// Story: US3 (public route availability, hidden handling, SSR metadata)
// Tags: @smoke @spec-010-us3

test("@smoke @spec-010-us3 visible public routes render core content", async ({ page }) => {
  await page.goto("/needs/need-001");
  await expect(page.getByRole("heading", { name: /need details/i })).toBeVisible();

  await page.goto("/campaigns/campaign-001");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/accounts/account-001");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("@smoke @spec-010-us3 hidden or unknown entities return not-found behavior", async ({ page }) => {
  const missingNeed = await page.goto("/needs/00000000-0000-0000-0000-000000000000");
  expect(missingNeed?.status()).toBe(404);

  const missingCampaign = await page.goto("/campaigns/00000000-0000-0000-0000-000000000000");
  expect(missingCampaign?.status()).toBe(404);

  const missingAccount = await page.goto("/accounts/00000000-0000-0000-0000-000000000000");
  expect(missingAccount?.status()).toBe(404);
});

test("@smoke @spec-010-us3 public pages include server-rendered SEO metadata", async ({ page }) => {
  const cases = [
    { path: "/needs/need-001", canonicalPath: "/needs/need-001" },
    { path: "/campaigns/campaign-001", canonicalPath: "/campaigns/campaign-001" },
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
