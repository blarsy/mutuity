import { appSettings } from "../../../src/config/appSettings";
import { confirmPendingSocialLink, SocialLinkConfirmationError } from "../../../src/services/socialAuth/confirmLink";

describe("confirmPendingSocialLink", () => {
  const originalFetch = global.fetch;
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
  });
  afterEach(() => { global.fetch = originalFetch; });

  it("uses the password-login session cookie to confirm a signed pending identity", async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await confirmPendingSocialLink("signed-token");
    expect(mockFetch).toHaveBeenCalledWith(`${appSettings.apiUrl}/auth/social/confirm-link`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingLinkToken: "signed-token" })
    });
  });

  it.each([400, 401, 500])("surfaces HTTP %s without claiming link success", async (status) => {
    mockFetch.mockResolvedValue({ ok: false, status });
    await expect(confirmPendingSocialLink("signed-token")).rejects.toBeInstanceOf(SocialLinkConfirmationError);
  });

  it("surfaces network failures", async () => {
    mockFetch.mockRejectedValue(new Error("offline"));
    await expect(confirmPendingSocialLink("signed-token")).rejects.toBeInstanceOf(SocialLinkConfirmationError);
  });

  it("does not send a request without a pending token", async () => {
    await expect(confirmPendingSocialLink("")).rejects.toBeInstanceOf(SocialLinkConfirmationError);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});