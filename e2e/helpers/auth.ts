import { expect, type Page } from "@playwright/test";

import { resolveAppPath, urlRegexForPath } from "./routes";

export async function loginViaUi(page: Page, opts: { identifier: string; password: string; nextPath: string }) {
  const destination = resolveAppPath(opts.nextPath);
  await page.goto(`/login?next=${encodeURIComponent(destination)}`);

  await page.locator('input[name="identifier"]').fill(opts.identifier);
  await page.locator('input[name="password"]').fill(opts.password);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(urlRegexForPath(destination), { timeout: 30_000 });
}
