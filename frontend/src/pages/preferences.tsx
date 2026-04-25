import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../features/auth/requireAuth";
import {
  GET_DELIVERY_PREFERENCES_MUTATION,
  SET_DELIVERY_PREFERENCE_MUTATION
} from "../features/preferences/preferences.queries";

const MANAGED_CATEGORIES = [
  "new_resource_added",
  "new_need_added",
  "unread_notifications",
  "new_chat_message_received"
] as const;

type ManagedCategory = typeof MANAGED_CATEGORIES[number];

type DeliveryPreference = {
  eventCategory: string;
  deliveryStrategy: string;
  summaryFrequencyDays: number;
};

type GetDeliveryPreferencesData = {
  getAccountDeliveryPreferences: {
    results: DeliveryPreference[];
  };
};

const FREQUENCY_OPTIONS = [1, 3, 7, 30] as const;

export default function PreferencesPage() {
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const { t } = useTranslation("preferences");

  const [loadPreferences, { loading }] = useMutation<GetDeliveryPreferencesData>(
    GET_DELIVERY_PREFERENCES_MUTATION
  );
  const [setPreference] = useMutation(SET_DELIVERY_PREFERENCE_MUTATION);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});

  const [preferences, setPreferences] = useState<Record<ManagedCategory, DeliveryPreference>>(() => {
    const defaults: Partial<Record<ManagedCategory, DeliveryPreference>> = {};
    for (const cat of MANAGED_CATEGORIES) {
      defaults[cat] = { eventCategory: cat, deliveryStrategy: "realtime_push", summaryFrequencyDays: 1 };
    }

    return defaults as Record<ManagedCategory, DeliveryPreference>;
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    loadPreferences().then(({ data }) => {
      if (!data?.getAccountDeliveryPreferences?.results) return;
      const updated: Record<ManagedCategory, DeliveryPreference> = { ...preferences };
      for (const pref of data.getAccountDeliveryPreferences.results) {
        if (MANAGED_CATEGORIES.includes(pref.eventCategory as ManagedCategory)) {
          updated[pref.eventCategory as ManagedCategory] = pref;
        }
      }

      setPreferences(updated);
    });
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStrategyChange = async (category: ManagedCategory, deliveryStrategy: string) => {
    const current = preferences[category];
    const summaryFrequencyDays = current.summaryFrequencyDays ?? 1;
    setPreferences(prev => ({
      ...prev,
      [category]: { ...current, deliveryStrategy }
    }));
    setSaveErrors(prev => ({ ...prev, [category]: "" }));

    try {
      await setPreference({
        variables: {
          eventCategory: category,
          deliveryStrategy,
          summaryFrequencyDays: deliveryStrategy === "email_summary" ? summaryFrequencyDays : null
        }
      });
    } catch {
      setSaveErrors(prev => ({ ...prev, [category]: t("saveError") }));
      setPreferences(prev => ({ ...prev, [category]: current }));
    }
  };

  const handleFrequencyChange = async (category: ManagedCategory, summaryFrequencyDays: number) => {
    const current = preferences[category];
    setPreferences(prev => ({
      ...prev,
      [category]: { ...current, summaryFrequencyDays }
    }));
    setSaveErrors(prev => ({ ...prev, [category]: "" }));

    try {
      await setPreference({
        variables: {
          eventCategory: category,
          deliveryStrategy: "email_summary",
          summaryFrequencyDays
        }
      });
    } catch {
      setSaveErrors(prev => ({ ...prev, [category]: t("saveError") }));
      setPreferences(prev => ({ ...prev, [category]: current }));
    }
  };

  if (isChecking || isRedirecting) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          {isRedirecting ? t("redirecting", { ns: "common" }) : t("checking", { ns: "common" })}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            {t("title")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("subtitle")}
          </Typography>
        </Box>

        {loading && <LinearProgress />}

        <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
          {t("inAppNote")}
        </Alert>

        <Alert severity="info" sx={{ fontSize: "0.85rem" }}>
          {t("activityNote")}
        </Alert>

        {MANAGED_CATEGORIES.map((category, index) => {
          const pref = preferences[category];
          const isEmailSummary = pref.deliveryStrategy === "email_summary";
          const saveError = saveErrors[category];

          return (
            <Card key={category} variant="outlined">
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t(`categories.${category}`)}
                  </Typography>

                  {saveError && (
                    <Alert severity="error" sx={{ py: 0.5 }}>
                      {saveError}
                    </Alert>
                  )}

                  <FormControl fullWidth size="small">
                    <InputLabel id={`strategy-label-${category}`}>
                      {t("strategy.label")}
                    </InputLabel>
                    <Select
                      labelId={`strategy-label-${category}`}
                      value={pref.deliveryStrategy}
                      label={t("strategy.label")}
                      onChange={e => handleStrategyChange(category, e.target.value as string)}
                      disabled={loading}
                    >
                      <MenuItem value="realtime_push">{t("strategy.realtime_push")}</MenuItem>
                      <MenuItem value="email_summary">{t("strategy.email_summary")}</MenuItem>
                    </Select>
                  </FormControl>

                  {isEmailSummary && (
                    <FormControl fullWidth size="small">
                      <InputLabel id={`freq-label-${category}`}>
                        {t("frequency.label")}
                      </InputLabel>
                      <Select
                        labelId={`freq-label-${category}`}
                        value={pref.summaryFrequencyDays}
                        label={t("frequency.label")}
                        onChange={e => handleFrequencyChange(category, Number(e.target.value))}
                        disabled={loading}
                      >
                        {FREQUENCY_OPTIONS.map(days => (
                          <MenuItem key={days} value={days}>
                            {t(`frequency.${days}` as `frequency.${typeof days}`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Stack>
              </CardContent>
              {index < MANAGED_CATEGORIES.length - 1 && <Divider />}
            </Card>
          );
        })}
      </Stack>
    </Container>
  );
}
