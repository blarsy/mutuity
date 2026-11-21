import { appSettings } from "../../config/appSettings";

export async function completeMobileSocialRegistration(input: {
  pendingRegistrationToken: string;
  displayName: string;
  identifier: string;
  password?: string;
  preferredLanguage: "en" | "fr";
}): Promise<{ sessionToken: string; accountId: string; next: string }> {
  const response = await fetch(`${appSettings.apiUrl}/auth/mobile/social/complete-registration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-selected-language": input.preferredLanguage
    },
    body: JSON.stringify(input)
  });

  const payload = await response.json() as {
    sessionToken?: unknown;
    accountId?: unknown;
    next?: unknown;
    error?: unknown;
  };

  if (!response.ok || typeof payload.sessionToken !== "string" || typeof payload.accountId !== "string") {
    throw new Error(typeof payload.error === "string" ? payload.error : "Social registration could not be completed");
  }

  return {
    sessionToken: payload.sessionToken,
    accountId: payload.accountId,
    next: typeof payload.next === "string" ? payload.next : "/"
  };
}