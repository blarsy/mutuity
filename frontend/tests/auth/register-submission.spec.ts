import { submitRegistration } from "../../src/features/auth/registerSubmission";

describe("submitRegistration", () => {
  it("uses social registration when provider and subject are present", async () => {
    const registerLocal = jest.fn().mockResolvedValue({ message: "local" });
    const registerSocial = jest.fn().mockResolvedValue({ message: "social" });

    await submitRegistration({
      displayName: "  Jane Doe  ",
      identifier: "  Jane@Example.COM ",
      password: "password-123",
      preferredLanguage: "en",
      provider: "google",
      providerSubject: "  google-sub-123  ",
      registerLocal,
      registerSocial
    });

    expect(registerLocal).not.toHaveBeenCalled();
    expect(registerSocial).toHaveBeenCalledTimes(1);
    expect(registerSocial).toHaveBeenCalledWith({
      identifier: "jane@example.com",
      displayName: "Jane Doe",
      password: "password-123",
      provider: "google",
      providerSubject: "google-sub-123",
      providerEmail: "jane@example.com",
      providerEmailVerified: true,
      preferredLanguage: "en"
    });
  });

  it("uses local registration when provider subject is missing", async () => {
    const registerLocal = jest.fn().mockResolvedValue({ message: "local" });
    const registerSocial = jest.fn().mockResolvedValue({ message: "social" });

    await submitRegistration({
      displayName: "  John Doe  ",
      identifier: "  John@Example.COM ",
      password: "password-123",
      preferredLanguage: "fr",
      provider: "google",
      providerSubject: "   ",
      registerLocal,
      registerSocial
    });

    expect(registerSocial).not.toHaveBeenCalled();
    expect(registerLocal).toHaveBeenCalledTimes(1);
    expect(registerLocal).toHaveBeenCalledWith({
      displayName: "John Doe",
      identifier: "john@example.com",
      password: "password-123",
      preferredLanguage: "fr"
    });
  });
});
