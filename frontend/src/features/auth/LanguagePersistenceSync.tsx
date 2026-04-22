import { useEffect, useRef } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { useTranslation } from "react-i18next";

import { useAuth } from "./AuthProvider";

const SET_PREFERRED_LANGUAGE_MUTATION = gql`
  mutation SetPreferredLanguage($accountId: UUID!, $language: String!) {
    updateAccountById(input: {
      id: $accountId,
      accountPatch: { preferredLanguage: $language }
    }) {
      account {
        id
        preferredLanguage
      }
    }
  }
`;

/**
 * Syncs the locally selected UI language to the account's preferred_language
 * server-side so that transactional emails are sent in the correct language.
 * Runs silently in the background – errors are intentionally swallowed so a
 * network failure never interrupts the user experience.
 */
export function LanguagePersistenceSync() {
  const { session } = useAuth();
  const { i18n } = useTranslation();
  const [setPreferredLanguage] = useMutation(SET_PREFERRED_LANGUAGE_MUTATION);
  const lastSyncedLanguageRef = useRef<string | null>(null);

  const accountId = session.authenticated ? session.account?.id ?? null : null;
  const currentLanguage = i18n.language;

  useEffect(() => {
    if (!accountId || !currentLanguage) {
      return;
    }

    if (lastSyncedLanguageRef.current === currentLanguage) {
      return;
    }

    lastSyncedLanguageRef.current = currentLanguage;

    void setPreferredLanguage({
      variables: { accountId, language: currentLanguage }
    }).catch(() => {
      // Silently ignore – language preference sync is best-effort
      lastSyncedLanguageRef.current = null;
    });
  }, [accountId, currentLanguage, setPreferredLanguage]);

  return null;
}
