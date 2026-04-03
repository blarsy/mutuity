export const AUTH_REQUIRED_EVENT = "mutuity:auth-required";

export function notifyAuthRequired() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(AUTH_REQUIRED_EVENT));
}
