import { appSettings } from "../../../src/config/appSettings";
import { completeMobileSocialRegistration } from "../../../src/services/socialAuth/completeRegistration";

describe("completeMobileSocialRegistration", () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });
  afterEach(() => { global.fetch = originalFetch; });

  it("submits signed provider registration data and returns the issued mobile session", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: "authenticated",
        sessionToken: "opaque-session-token",
        accountId: "123e4567-e89b-12d3-a456-426614174000",
        next: "/my-hub"
      })
    });

    await expect(completeMobileSocialRegistration({
      pendingRegistrationToken: "signed-registration-token",
      displayName: "Social Member",
      identifier: "member@example.com",
      password: "StrongPass123!",
      preferredLanguage: "en"
    })).resolves.toEqual({
      sessionToken: "opaque-session-token",
      accountId: "123e4567-e89b-12d3-a456-426614174000",
      next: "/my-hub"
    });

    expect(mockFetch).toHaveBeenCalledWith(`${appSettings.apiUrl}/auth/mobile/social/complete-registration`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-selected-language": "en" },
      body: JSON.stringify({
        pendingRegistrationToken: "signed-registration-token",
        displayName: "Social Member",
        identifier: "member@example.com",
        password: "StrongPass123!",
        preferredLanguage: "en"
      })
    });
  });

  it("surfaces the backend error when registration cannot be completed", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: "Registration failed" }) });
    await expect(completeMobileSocialRegistration({
      pendingRegistrationToken: "bad-token",
      displayName: "Social Member",
      identifier: "member@example.com",
      preferredLanguage: "fr"
    })).rejects.toThrow("Registration failed");
  });
});
