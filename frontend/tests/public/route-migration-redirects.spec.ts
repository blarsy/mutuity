import fs from "fs";
import path from "path";

const legacyAppRedirects = require("../../legacyAppRedirects.cjs") as Array<{
  source: string;
  destination: string;
  permanent: boolean;
}>;

describe("legacy to /app route migration contract", () => {
  it("keeps legacy redirects as temporary redirects", () => {
    expect(legacyAppRedirects.length).toBeGreaterThan(0);
    expect(legacyAppRedirects.every(redirect => redirect.permanent === false)).toBe(true);
  });

  it("covers top-level wildcard route families", () => {
    const mapping = new Map(legacyAppRedirects.map(entry => [entry.source, entry.destination]));

    expect(mapping.get("/needs/:path*")).toBe("/app/needs/:path*");
    expect(mapping.get("/resources/:path*")).toBe("/app/resources/:path*");
    expect(mapping.get("/campaigns/:path*")).toBe("/app/campaigns/:path*");
    expect(mapping.get("/accounts/:path*")).toBe("/app/accounts/:path*");
    expect(mapping.get("/admin/:path*")).toBe("/app/admin/:path*");
    expect(mapping.get("/grants/:path*")).toBe("/app/grants/:path*");
  });

  it("covers top-level singleton routes", () => {
    const mapping = new Map(legacyAppRedirects.map(entry => [entry.source, entry.destination]));

    expect(mapping.get("/notifications")).toBe("/app/notifications");
    expect(mapping.get("/chat")).toBe("/app/chat");
    expect(mapping.get("/claims")).toBe("/app/claims");
    expect(mapping.get("/bids")).toBe("/app/bids");
    expect(mapping.get("/contribution")).toBe("/app/contribution");
    expect(mapping.get("/preferences")).toBe("/app/preferences");
    expect(mapping.get("/profile")).toBe("/app/profile");
    expect(mapping.get("/change-password")).toBe("/app/change-password");
  });

  it("keeps explicit root-level pages unredirected", () => {
    const sources = new Set(legacyAppRedirects.map(entry => entry.source));

    expect(sources.has("/")).toBe(false);
    expect(sources.has("/privacy")).toBe(false);
    expect(sources.has("/terms")).toBe(false);
  });

  it("ensures key /app page entrypoints exist", () => {
    const root = path.resolve(__dirname, "../../src/pages");

    const requiredFiles = [
      "app.tsx",
      "app/needs/index.tsx",
      "app/resources/index.tsx",
      "app/campaigns/index.tsx",
      "app/notifications.tsx",
      "app/chat.tsx",
      "app/claims.tsx",
      "app/bids.tsx",
      "app/contribution.tsx",
      "app/preferences.tsx",
      "app/profile.tsx",
      "app/change-password.tsx"
    ];

    for (const relativePath of requiredFiles) {
      expect(fs.existsSync(path.join(root, relativePath))).toBe(true);
    }
  });
});
