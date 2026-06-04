import { TEST_BACKEND_URL } from "./auth-test-helpers";

jest.setTimeout(30000);

describe("social auth start routes", () => {
  it("exposes google and apple start endpoints (never 404)", async () => {
    const googleResponse = await fetch(`${TEST_BACKEND_URL}/auth/google/start?next=%2Fapp`, {
      redirect: "manual"
    });
    const appleResponse = await fetch(`${TEST_BACKEND_URL}/auth/apple/start?next=%2Fapp`, {
      redirect: "manual"
    });

    expect([302, 501]).toContain(googleResponse.status);
    expect([302, 501]).toContain(appleResponse.status);

    if (googleResponse.status === 302) {
      const location = googleResponse.headers.get("location");
      expect(location).toBeTruthy();

      const redirectUrl = new URL(String(location));
      expect(redirectUrl.origin).toBe("https://accounts.google.com");
      expect(redirectUrl.pathname).toBe("/o/oauth2/v2/auth");
      expect(redirectUrl.searchParams.get("response_type")).toBe("code");
      expect(redirectUrl.searchParams.get("state")).toBeTruthy();
      expect(redirectUrl.searchParams.get("scope")).toContain("openid");
      expect(redirectUrl.searchParams.get("scope")).toContain("email");
      expect(redirectUrl.searchParams.get("scope")).toContain("profile");
    }

    if (appleResponse.status === 302) {
      const location = appleResponse.headers.get("location");
      expect(location).toBeTruthy();

      const redirectUrl = new URL(String(location));
      expect(redirectUrl.origin).toBe("https://appleid.apple.com");
      expect(redirectUrl.pathname).toBe("/auth/authorize");
      expect(redirectUrl.searchParams.get("response_type")).toBe("code");
      expect(redirectUrl.searchParams.get("response_mode")).toBe("form_post");
      expect(redirectUrl.searchParams.get("state")).toBeTruthy();
      expect(redirectUrl.searchParams.get("nonce")).toBeTruthy();
    }
  });

  it("rejects unsupported social providers", async () => {
    const response = await fetch(`${TEST_BACKEND_URL}/auth/facebook/start?next=%2F`, {
      redirect: "manual"
    });

    expect(response.status).toBe(404);

    await expect(response.json()).resolves.toMatchObject({
      error: "Unsupported social provider"
    });
  });

  it("does not leak an external next destination in Google redirects", async () => {
    const response = await fetch(
      `${TEST_BACKEND_URL}/auth/google/start?next=${encodeURIComponent("https://evil.example/phish")}`,
      {
        redirect: "manual"
      }
    );

    expect([302, 501]).toContain(response.status);

    if (response.status === 302) {
      const location = response.headers.get("location") ?? "";
      expect(location).not.toContain("evil.example");
      expect(location).not.toContain("https%3A%2F%2Fevil.example");
    }
  });

  it("rejects GET requests to the Apple callback endpoint", async () => {
    const response = await fetch(`${TEST_BACKEND_URL}/auth/apple/callback`, {
      method: "GET",
      redirect: "manual"
    });

    expect(response.status).toBe(405);

    await expect(response.json()).resolves.toMatchObject({
      error: "Method not allowed. Apple callback expects POST."
    });
  });
});
