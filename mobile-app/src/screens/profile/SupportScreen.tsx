import React, { useCallback, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Snackbar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { FormTextInput, PrimaryButton, ScreenContainer } from "../../components/primitives";
import { createDiagnosticsSnapshot, formatDiagnosticsForDisplay, getSupportAppMetadata } from "../../services/support/diagnostics";
import { submitIssueReport } from "../../services/support/reportIssue";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface SupportScreenProps {
  appVersion?: string;
  buildNumber?: string;
  onBack?: () => void;
}

export function SupportScreen({ appVersion, buildNumber, onBack }: SupportScreenProps): React.JSX.Element {
  const { t } = useTranslation();
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const sendingRef = useRef(false);

  const metadata = getSupportAppMetadata(appVersion, buildNumber);
  const diagnostics = createDiagnosticsSnapshot(metadata.appVersion, metadata.buildNumber);
  const diagnosticsText = formatDiagnosticsForDisplay(diagnostics);

  const handleSendReport = useCallback(async () => {
    if (sendingRef.current) return;
    if (!summary.trim()) {
      setFeedback(t("supportReportSummaryLabel", { defaultValue: "Summary" }) + " " + t("fieldRequired", { defaultValue: "is required." }));
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setFeedback(null);

    try {
      await submitIssueReport({
        summary: summary.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(appVersion ? { appVersion } : {}),
        ...(buildNumber ? { buildNumber } : {})
      });

      setFeedback(t("supportReportSent", { defaultValue: "Report sent. Thank you!" }));
      setSummary("");
      setDescription("");
    } catch {
      setFeedback(t("supportReportError", { defaultValue: "We could not send your report. Please try again." }));
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }, [summary, description, appVersion, buildNumber, t]);

  return (
    <ScreenContainer testID="support-screen" style={styles.root}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" variant="headlineSmall" style={styles.title}>
          {t("supportTitle", { defaultValue: "Support" })}
        </Text>
        {onBack ? <PrimaryButton label={t("backLabel", { defaultValue: "Back" })} onPress={onBack} /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t("supportReportIssue", { defaultValue: "Report an issue" })}
        </Text>

        <FormTextInput
          label={t("supportReportSummaryLabel", { defaultValue: "Summary" })}
          accessibilityLabel={t("supportReportSummaryLabel", { defaultValue: "Summary" })}
          value={summary}
          onChangeText={setSummary}
          maxLength={200}
          editable={!sending}
        />

        <FormTextInput
          label={t("supportReportDescriptionLabel", { defaultValue: "Description" })}
          accessibilityLabel={t("supportReportDescriptionLabel", { defaultValue: "Description" })}
          value={description}
          onChangeText={setDescription}
          maxLength={8000}
          editable={!sending}
          multiline
          numberOfLines={4}
        />

        <PrimaryButton
          label={t("supportReportSend", { defaultValue: "Send report" })}
          onPress={() => void handleSendReport()}
          disabled={sending || !summary.trim()}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t("supportDiagnosticsLabel", { defaultValue: "Diagnostics" })}
        </Text>

        <Text variant="bodySmall" style={styles.diagnosticsText}>
          {diagnosticsText}
        </Text>
      </ScrollView>

      {feedback ? (
        <Snackbar
          key={feedback}
          visible
          onDismiss={() => setFeedback(current => current === feedback ? null : current)}
          duration={3000}
        >
          {feedback}
        </Snackbar>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingTop: designTokens.spacing.lg,
    gap: designTokens.spacing.sm
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: designTokens.spacing.md
  },
  title: {
    fontFamily: appFontFamilies.title,
    textTransform: "uppercase",
    letterSpacing: 0.6
  },
  content: {
    gap: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.xl
  },
  sectionTitle: {
    fontFamily: appFontFamilies.altGeneral,
    marginTop: designTokens.spacing.sm
  },
  diagnosticsText: {
    fontFamily: appFontFamilies.general,
    backgroundColor: "#f5f5f5",
    padding: designTokens.spacing.md,
    borderRadius: 8,
    lineHeight: 20
  }
});