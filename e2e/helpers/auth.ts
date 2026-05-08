import { expect, type Page } from "@playwright/test";

export async function loginViaUi(page: Page, opts: { identifier: string; password: string; nextPath: string }) {
  const nextParam = encodeURIComponent(opts.nextPath);
  await page.goto(`/login?next=${nextParam}`);

  await page.locator('input[name="identifier"]').fill(opts.identifier);
  await page.locator('input[name="password"]').fill(opts.password);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(new RegExp(`${opts.nextPath.replace("/", "\\/")}(\\?.*)?$`));
}
