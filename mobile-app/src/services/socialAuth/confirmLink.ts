import { appSettings } from "../../config/appSettings";

export class SocialLinkConfirmationError extends Error {
  constructor() {
    super("Social identity could not be linked");
    this.name = "SocialLinkConfirmationError";
  }
}

// authLogin issues an HttpOnly session cookie. Use that session, not an
// account ID or the pending token itself, to authenticate link confirmation.
export async function confirmPendingSocialLink(pendingLinkToken: string, sessionToken: string): Promise<void> {
  if (!pendingLinkToken || !sessionToken) {
    throw new SocialLinkConfirmationError();
  }

  try {
    const response = await fetch(`${appSettings.apiUrl}/auth/social/confirm-link`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ pendingLinkToken })
    });
    if (!response.ok) {
      throw new SocialLinkConfirmationError();
    }
  } catch {
    throw new SocialLinkConfirmationError();
  }
}