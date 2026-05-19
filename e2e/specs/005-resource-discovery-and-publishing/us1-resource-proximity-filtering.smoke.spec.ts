import { expect, test } from "@playwright/test";

import { loginViaUi } from "../../helpers/auth";
import {
  E2E_CREATOR_IDENTIFIER,
  E2E_PASSWORD,
  E2E_RESOURCE_TITLE
} from "../../helpers/testUsers";

// Spec: specs/005-resource-discovery-and-publishing
// Stories: US5 Resource Proximity Filtering
// Tags: @smoke @spec-005-proximity @t096

test("@smoke @spec-005-proximity visitor can see proximity controls on resource discovery page", async ({ page }) => {
  await page.goto("/resources");

  // Check for Proximity section (take first instance since text may appear multiple times)
  const proximitySection = page.locator("text=/[Pp]roximity/i").first();
  await expect(proximitySection).toBeVisible();

  // Check for distance slider (MUI Slider renders as input[type=range])
  const slider = page.locator('input[type="range"]');
  await expect(slider).toBeVisible();

  // Check for distance display text (take first instance)
  const distanceText = page.locator("text=/[Mm]aximum distance/i").first();
  await expect(distanceText).toBeVisible();
});

test("@smoke @spec-005-proximity distance slider has correct range (1-50 km)", async ({ page }) => {
  await page.goto("/resources");

  const slider = page.locator('input[type="range"]');
  await expect(slider).toBeVisible();

  // Verify slider attributes for 1-50 km range
  const minAttr = await slider.getAttribute("min");
  const maxAttr = await slider.getAttribute("max");

  expect(parseInt(minAttr || "0")).toBe(1);
  expect(parseInt(maxAttr || "0")).toBe(50);

  // Verify slider is interactive - adjust and check value
  const initialValue = await slider.inputValue();
  expect(parseInt(initialValue)).toBeGreaterThanOrEqual(1);
  expect(parseInt(initialValue)).toBeLessThanOrEqual(50);
});

test("@smoke @spec-005-proximity seeded resource appears in search results", async ({ page }) => {
  await page.goto("/resources");

  // Search for the seeded resource
  await page.getByLabel(/search/i).first().fill(E2E_RESOURCE_TITLE);

  // Wait for results to appear
  await page.waitForTimeout(300);

  // The resource should be visible
  const resourceLink = page.locator(`text=${E2E_RESOURCE_TITLE}`).first();
  await expect(resourceLink).toBeVisible();
});

test("@smoke @spec-005-proximity distance slider updates when interacted with", async ({ page }) => {
  await page.goto("/resources");

  const slider = page.locator('input[type="range"]');
  await expect(slider).toBeVisible();

  // Get initial value
  const initialValue = await slider.inputValue();
  const initialNum = parseInt(initialValue);

  // Set to a different value
  const newValue = initialNum === 1 ? 25 : 1;
  await slider.fill(String(newValue));

  // Verify the value changed
  const updatedValue = await slider.inputValue();
  expect(parseInt(updatedValue)).toBe(newValue);

  // Check that the distance text updates
  const distanceText = page.locator(`text=/maximum distance: ${newValue}/i`);
  await expect(distanceText).toBeVisible();
});

test("@smoke @spec-005-proximity authenticated slider change sends max distance with reference coordinates", async ({ page }) => {
  await loginViaUi(page, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/resources"
  });

  const slider = page.locator('input[type="range"]').first();
  await expect(slider).toBeVisible();

  const requestPromise = page.waitForRequest(request => {
    if (!request.url().includes("/graphql") || request.method() !== "POST") {
      return false;
    }

    const payload = request.postDataJSON() as {
      operationName?: string;
      variables?: {
        maxDistanceKm?: number;
      };
    };

    return payload.operationName === "PublicResources" && payload.variables?.maxDistanceKm === 43;
  });

  await slider.fill("43");

  const payload = requestPromise.then(request => request.postDataJSON() as {
    variables: {
      latitude: number | null;
      longitude: number | null;
      browserLatitude: number | null;
      browserLongitude: number | null;
      maxDistanceKm: number;
    };
  });

  await expect(slider).toHaveValue("43");

  const requestBody = await payload;
  const hasPrimaryCoordinates = requestBody.variables.latitude !== null && requestBody.variables.longitude !== null;
  const hasBrowserCoordinates = requestBody.variables.browserLatitude !== null && requestBody.variables.browserLongitude !== null;

  expect(requestBody.variables.maxDistanceKm).toBe(43);
  expect(hasPrimaryCoordinates || hasBrowserCoordinates).toBe(true);
});

test("@smoke @spec-005-proximity favor local resources label and control visible", async ({ page }) => {
  await page.goto("/resources");

  // Find the label containing "favor local" text (case-insensitive)
  const favorLocalLabel = page.locator("label").filter({
    hasText: /[Ff]avor local/i
  });
  
  await expect(favorLocalLabel).toBeVisible();
  
  // The label should contain a checkbox input
  const checkbox = favorLocalLabel.locator('input[type="checkbox"]');
  await expect(checkbox).toBeVisible();
});

test("@smoke @spec-005-proximity creator can publish resource without location", async ({ page }) => {
  // Login as creator
  await loginViaUi(page, {
    identifier: E2E_CREATOR_IDENTIFIER,
    password: E2E_PASSWORD,
    nextPath: "/resources/create"
  });

  // Fill required title field (location is optional, so we skip it)
  const titleInput = page.locator('input[name="title"]');
  const resourceTitle = `E2E Proximity No Location ${Date.now()}`;
  await titleInput.fill(resourceTitle);

  // Submit form
  const submitButton = page.locator('button[type="submit"]');
  await submitButton.click();

  // Should navigate back to manage page after successful publish (indicating publish succeeded)
  // This verifies that resources can be published without location/coordinates
  await page.waitForURL(/\/resources\/manage/, { timeout: 10000 });
  await expect(page).toHaveURL(/\/resources\/manage(\?.*)?$/);
});


