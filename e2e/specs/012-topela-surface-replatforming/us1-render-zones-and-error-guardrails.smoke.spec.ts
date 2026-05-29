import { expect, test } from "@playwright/test";

// Spec: specs/012-topela-surface-replatforming
// Stories: Milestone I (T012-040, T012-042)
// Tags: @smoke @spec-012 @production-safety

test("@smoke @spec-012-us1 landing/campaign/legal render expected first-screen zones", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/latest resources|dernieres ressources|dernières ressources/i)).toBeVisible();
  await expect(page.getByText(/latest contributors|derniers contributeurs/i)).toBeVisible();

  await page.goto("/campaigns");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/sign in to see your campaigns|connectez-vous pour voir vos campagnes/i)).toBeVisible();

  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 6 }).first()).toBeVisible();

  await page.goto("/terms");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { level: 6 }).first()).toBeVisible();
});

test("@smoke @spec-012-us1 production UI does not expose raw GraphQL failure details", async ({ page }) => {
  const rawDbMessage = 'syntax error at or near "select"';

  await page.route("**/graphql", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        errors: [{ message: rawDbMessage }]
      })
    });
  });

  await page.goto("/");

  await expect(page.locator(".MuiAlert-standardWarning").first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText(rawDbMessage);
});
