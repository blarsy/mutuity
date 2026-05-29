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
      const location = googleResponse.headers.get("location") ?? "";
      expect(location).toContain("next=%2Fapp");
    }

    if (appleResponse.status === 302) {
      const location = appleResponse.headers.get("location") ?? "";
      expect(location).toContain("next=%2Fapp");
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
});
