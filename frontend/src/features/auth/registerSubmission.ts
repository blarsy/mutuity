type RegisterLocalInput = {
  displayName: string;
  identifier: string;
  password: string;
  preferredLanguage: "en" | "fr";
};

type RegistrationResult = {
  message?: string;
};

type RegisterSocialInput = {
  identifier: string;
  displayName: string;
  password?: string;
  provider: "google" | "apple";
  providerSubject: string;
  providerEmail: string;
  providerEmailVerified: boolean;
  preferredLanguage: "en" | "fr";
};

type SubmitRegistrationInput = {
  displayName: string;
  identifier: string;
  password: string;
  preferredLanguage: "en" | "fr";
  provider: string;
  providerSubject: string;
  registerLocal: (input: RegisterLocalInput) => Promise<RegistrationResult>;
  registerSocial: (input: RegisterSocialInput) => Promise<RegistrationResult>;
};

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export function shouldUseSocialRegistration(provider: string, providerSubject: string) {
  return (provider === "google" || provider === "apple") && providerSubject.trim().length > 0;
}

export async function submitRegistration(input: SubmitRegistrationInput) {
  const normalizedIdentifier = normalizeIdentifier(input.identifier);
  const trimmedPassword = input.password.trim();

  if (shouldUseSocialRegistration(input.provider, input.providerSubject)) {
    return input.registerSocial({
      identifier: normalizedIdentifier,
      displayName: input.displayName.trim(),
      password: trimmedPassword.length > 0 ? input.password : undefined,
      provider: input.provider as "google" | "apple",
      providerSubject: input.providerSubject.trim(),
      providerEmail: normalizedIdentifier,
      providerEmailVerified: true,
      preferredLanguage: input.preferredLanguage
    });
  }

  return input.registerLocal({
    displayName: input.displayName.trim(),
    identifier: normalizedIdentifier,
    password: input.password,
    preferredLanguage: input.preferredLanguage
  });
}
