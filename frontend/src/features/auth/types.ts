export type AuthRole = "anonymous" | "identified_account" | "admin" | string;

export type CurrentAccount = {
  id: string;
  displayName: string | null;
  externalSubject: string;
  avatarUrl?: string | null;
  emailVerified: boolean;
  preferredLanguage?: string | null;
};

export type AuthSession = {
  authenticated: boolean;
  account: CurrentAccount | null;
  role: AuthRole;
  expiresAt: string | null;
};

export type LoginInput = {
  identifier: string;
  password: string;
};
