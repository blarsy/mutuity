import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { designTokens } from "../../theme/tokens";

export type MyHubSection =
  | "myResources" | "receivedBids" | "sentBids"
  | "myNeeds" | "receivedClaims" | "sentClaims"
  | "profile" | "preferences" | "contribution";

const groups = [
  { titleKey: "myHubResourcesGroup", items: [
    { key: "myResources", labelKey: "myHubDrawerMyResources", icon: "cube-outline" },
    { key: "receivedBids", labelKey: "myHubDrawerReceivedBids", icon: "arrow-down-circle-outline" },
    { key: "sentBids", labelKey: "myHubDrawerSentBids", icon: "arrow-up-circle-outline" }
  ] },
  { titleKey: "myHubNeedsGroup", items: [
    { key: "myNeeds", labelKey: "myHubDrawerMyNeeds", icon: "clipboard-list-outline" },
    { key: "receivedClaims", labelKey: "myHubDrawerReceivedClaims", icon: "download-circle-outline" },
    { key: "sentClaims", labelKey: "myHubDrawerSentClaims", icon: "arrow-up-circle-outline" }
  ] },
  { titleKey: "myHubAccountGroup", items: [
    { key: "profile", labelKey: "myHubDrawerProfile", icon: "account-circle-outline" },
    { key: "preferences", labelKey: "myHubDrawerPreferences", icon: "tune-variant" },
    { key: "contribution", labelKey: "myHubDrawerContribution", icon: "cash-multiple" }
  ] }
] as const;


export function MyHubDashboardScreen({ onOpenSection }: { onOpenSection: (section: MyHubSection) => void }): React.JSX.Element {
  const { t } = useTranslation("us1");

  return (
    <ScrollView testID="my-hub-dashboard" contentContainerStyle={styles.container}>
      {groups.map((group) => (
        <View key={group.titleKey} style={styles.group} testID={group.titleKey}>
          <Text accessibilityRole="header" variant="titleLarge" style={styles.groupTitle}>
            {t(group.titleKey)}
          </Text>
          <View style={styles.items}>
            {group.items.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={t(item.labelKey)}
                testID={`my-hub-section-${item.key}`}
                onPress={() => onOpenSection(item.key)}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <View style={styles.icon}>
                  <MaterialCommunityIcons name={item.icon} size={32} color={designTokens.colors.primary} />
                </View>
                <Text variant="titleMedium" style={styles.itemLabel}>{t(item.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: designTokens.spacing.md, gap: designTokens.spacing.lg },
  group: { gap: designTokens.spacing.sm },
  groupTitle: { color: "#7a3a15", textAlign: 'center'
   },
  items: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: designTokens.spacing.sm },
  item: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: designTokens.spacing.xs,
    gap: designTokens.spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1d6bf",
    backgroundColor: "#fff2e6"
  },
  pressed: { backgroundColor: designTokens.colors.secondary },
  icon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemLabel: { color: "#7a3a15", textAlign: "center", fontSize: 16, lineHeight: 20 }
});