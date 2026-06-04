import { generateSocialAuthNonce, signSocialAuthState, verifySocialAuthState } from "../../src/auth/socialState";

describe("social auth state helpers", () => {
  const secret = "test-social-state-secret";

  it("round-trips signed payload including nonce and link fields", () => {
    const state = signSocialAuthState(
      {
        next: "/settings/security",
        link: true,
        nonce: "abc123nonce"
      },
      secret
    );

    const payload = verifySocialAuthState(state, secret);

    expect(payload).toMatchObject({
      next: "/settings/security",
      link: true,
      nonce: "abc123nonce"
    });
  });

  it("rejects tampered signatures", () => {
    const state = signSocialAuthState({ next: "/" }, secret);
    const [payloadPart, signaturePart] = state.split(".");
    const tamperedSignature = `${signaturePart}tamper`;

    const payload = verifySocialAuthState(`${payloadPart}.${tamperedSignature}`, secret);

    expect(payload).toBeNull();
  });

  it("rejects expired states", () => {
    const issuedAt = Math.floor(Date.now() / 1000) - 3600;
    const state = signSocialAuthState({ next: "/", issuedAt }, secret);

    const payload = verifySocialAuthState(state, secret);

    expect(payload).toBeNull();
  });

  it("generates non-empty nonce values", () => {
    const first = generateSocialAuthNonce();
    const second = generateSocialAuthNonce();

    expect(first).toMatch(/^[a-f0-9]{32}$/i);
    expect(second).toMatch(/^[a-f0-9]{32}$/i);
    expect(second).not.toBe(first);
  });
});
