import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { AppSegmentedButtons, FormFieldLabel, PrimaryButton, ScreenContainer } from "../../components/primitives";
import {
  fetchNotificationPreferencesFromBackend,
  getNotificationPreferences,
  saveNotificationPreferenceToBackend,
  setNotificationPreference,
  type NotificationPreferenceRecord
} from "../../services/graphql/notificationPreferences";
import { ErrorState } from "../../components/state/ErrorState";
import { LoadingState } from "../../components/state/LoadingState";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

const PREFERENCE_CATEGORIES = ["chat", "new_resources", "unread_notifications"] as const;

type DeliveryMode = "realtime" | "summary";
type SummaryCadenceDays = 1 | 3 | 7 | 30;

interface LocalPreferenceState {
  deliveryMode: DeliveryMode;
  summaryCadenceDays: SummaryCadenceDays;
}

type CategoryKey = (typeof PREFERENCE_CATEGORIES)[number];

function toRecord(stateByCategory: Record<CategoryKey, LocalPreferenceState>): NotificationPreferenceRecord[] {
  return PREFERENCE_CATEGORIES.map((category) => ({
    eventCategory: category,
    deliveryMode: stateByCategory[category].deliveryMode
  }));
}

function hydrateState(preferences: NotificationPreferenceRecord[]): Record<CategoryKey, LocalPreferenceState> {
  const fallback: Record<CategoryKey, LocalPreferenceState> = {
    chat: { deliveryMode: "realtime", summaryCadenceDays: 7 },
    new_resources: { deliveryMode: "realtime", summaryCadenceDays: 7 },
    unread_notifications: { deliveryMode: "summary", summaryCadenceDays: 3 }
  };

  preferences.forEach((entry) => {
    if (entry.eventCategory in fallback) {
      const category = entry.eventCategory as CategoryKey;
      fallback[category] = {
        ...fallback[category],
        deliveryMode: entry.deliveryMode
      };
    }
  });

  return fallback;
}

export interface MyPreferencesScreenProps {
  accountId?: string | null;
  onBack?: () => void;
}

export function MyPreferencesScreen({ accountId = null, onBack }: MyPreferencesScreenProps = {}): React.JSX.Element {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [stateByCategory, setStateByCategory] = useState<Record<CategoryKey, LocalPreferenceState>>({
    chat: { deliveryMode: "realtime", summaryCadenceDays: 7 },
    new_resources: { deliveryMode: "realtime", summaryCadenceDays: 7 },
    unread_notifications: { deliveryMode: "summary", summaryCadenceDays: 3 }
  });
  const [persistedStateByCategory, setPersistedStateByCategory] = useState<Record<CategoryKey, LocalPreferenceState>>({
    chat: { deliveryMode: "realtime", summaryCadenceDays: 7 },
    new_resources: { deliveryMode: "realtime", summaryCadenceDays: 7 },
    unread_notifications: { deliveryMode: "summary", summaryCadenceDays: 3 }
  });

  const loadPreferences = useCallback(() => {
    setLoading(true);
    if (accountId) {
      void fetchNotificationPreferencesFromBackend(accountId)
        .then((preferences) => {
          const nextState = hydrateState(preferences);
          setStateByCategory(nextState);
          setPersistedStateByCategory(nextState);
          setErrorMessage(null);
        })
        .catch(() => {
          setErrorMessage(t("preferencesLoadError", { defaultValue: "We could not load your preferences." }));
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    try {
      const preferences = getNotificationPreferences();
      const nextState = hydrateState(preferences);
      setStateByCategory(nextState);
      setPersistedStateByCategory(nextState);
      setErrorMessage(null);
    } catch {
      setErrorMessage(t("preferencesLoadError", { defaultValue: "We could not load your preferences." }));
    } finally {
      setLoading(false);
    }
  }, [accountId, t]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const dirty = useMemo(() => {
    return JSON.stringify(persistedStateByCategory) !== JSON.stringify(stateByCategory);
  }, [persistedStateByCategory, stateByCategory]);

  if (loading) {
    return <LoadingState label={t("preferencesLoading", { defaultValue: "Loading preferences..." })} />;
  }

  if (errorMessage) {
    return <ErrorState message={errorMessage} onRetry={loadPreferences} />;
  }

  return (
    <ScreenContainer testID="my-preferences-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {t("myPreferencesTitle", { defaultValue: "My preferences" })}
        </Text>
        {onBack ? <PrimaryButton label={t("backLabel", { defaultValue: "Back" })} onPress={onBack} /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {PREFERENCE_CATEGORIES.map((category) => {
          const currentState = stateByCategory[category];

          return (
            <View key={category} style={styles.preferenceCard}>
              <FormFieldLabel>
                {t(`preferences.${category}.title`, {
                  defaultValue:
                    category === "chat"
                      ? "Chat"
                      : category === "new_resources"
                        ? "New resources"
                        : "Unread notifications"
                })}
              </FormFieldLabel>

              <AppSegmentedButtons
                value={currentState.deliveryMode}
                onValueChange={(value) => {
                  if (value === "realtime" || value === "summary") {
                    setStateByCategory((previous) => ({
                      ...previous,
                      [category]: {
                        ...previous[category],
                        deliveryMode: value
                      }
                    }));
                  }
                }}
                buttons={[
                  {
                    value: "realtime",
                    label: t("preferencesDeliveryRealtime", { defaultValue: "Realtime" })
                  },
                  {
                    value: "summary",
                    label: t("preferencesDeliverySummary", { defaultValue: "Summary" })
                  }
                ]}
              />

              {currentState.deliveryMode === "summary" ? (
                <View style={styles.summaryZone}>
                  <FormFieldLabel>
                    {t("preferencesSummaryCadence", { defaultValue: "Summary cadence" })}
                  </FormFieldLabel>
                  <AppSegmentedButtons
                    value={String(currentState.summaryCadenceDays)}
                    onValueChange={(value) => {
                      const parsed = Number.parseInt(value, 10);
                      if (parsed === 1 || parsed === 3 || parsed === 7 || parsed === 30) {
                        setStateByCategory((previous) => ({
                          ...previous,
                          [category]: {
                            ...previous[category],
                            summaryCadenceDays: parsed
                          }
                        }));
                      }
                    }}
                    buttons={[
                      { value: "1", label: t("preferencesCadence1", { defaultValue: "1d" }) },
                      { value: "3", label: t("preferencesCadence3", { defaultValue: "3d" }) },
                      { value: "7", label: t("preferencesCadence7", { defaultValue: "7d" }) },
                      { value: "30", label: t("preferencesCadence30", { defaultValue: "30d" }) }
                    ]}
                  />
                </View>
              ) : null}
            </View>
          );
        })}

        <PrimaryButton
          label={t("saveLabel", { defaultValue: "Save" })}
          onPress={() => {
            const entries = toRecord(stateByCategory);

            if (accountId) {
              void Promise.all(entries.map((entry) => saveNotificationPreferenceToBackend(accountId, entry)))
                .then(() => {
                  setPersistedStateByCategory(stateByCategory);
                  setFeedback(t("preferencesSaved", { defaultValue: "Preferences saved." }));
                })
                .catch(() => {
                  setErrorMessage(t("preferencesSaveError", { defaultValue: "We could not save your preferences." }));
                });
              return;
            }

            entries.forEach((entry) => {
              setNotificationPreference(entry);
            });
            setPersistedStateByCategory(stateByCategory);
            setFeedback(t("preferencesSaved", { defaultValue: "Preferences saved." }));
          }}
          disabled={!dirty}
        />
      </ScrollView>

      <Snackbar visible={feedback !== null} onDismiss={() => setFeedback(null)}>
        {feedback ?? ""}
      </Snackbar>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: designTokens.spacing.md,
    paddingTop: designTokens.spacing.lg
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  content: {
    gap: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.md
  },
  preferenceCard: {
    borderRadius: designTokens.radius.md,
    backgroundColor: designTokens.colors.secondary,
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.sm
  },
  preferenceTitle: {
    fontFamily: appFontFamilies.altGeneral,
    fontSize: 18,
    lineHeight: 22
  },
  summaryZone: {
    gap: designTokens.spacing.xs
  },
  summaryTitle: {
    opacity: 0.8
  }
});
