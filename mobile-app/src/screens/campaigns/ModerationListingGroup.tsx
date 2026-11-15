import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text } from "react-native-paper";
import { designTokens } from "../../theme/tokens";

type ModerationEntry = { status: string; submittedAt: string; actedAt?: string | null };

function lastAction(item: ModerationEntry): number {
  const action = Date.parse(item.actedAt ?? "");
  return Number.isFinite(action) ? action : Date.parse(item.submittedAt) || 0;
}

export function ModerationListingGroup<T extends ModerationEntry>({ items, rejectedLabel, testID, renderItem }: {
  items: T[];
  rejectedLabel: string;
  testID: string;
  renderItem: (item: T, index: number) => React.ReactNode;
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const active = items.filter(item => item.status === "PENDING" || item.status === "ACCEPTED")
    .sort((a, b) => lastAction(b) - lastAction(a));
  const rejected = items.filter(item => item.status === "REJECTED")
    .sort((a, b) => lastAction(b) - lastAction(a));
  return (
    <View>
      {active.map(renderItem)}
      {rejected.length > 0 ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={rejectedLabel}
            accessibilityState={{ expanded }}
            onPress={() => setExpanded(value => !value)}
            testID={`${testID}-toggle`}
            style={styles.toggle}
          >
            <Text variant="bodyMedium" style={styles.label}>{rejectedLabel}</Text>
            <Icon source={expanded ? "chevron-up" : "chevron-right"} size={22} color={designTokens.colors.primary} />
          </Pressable>
          {expanded ? <View testID={`${testID}-list`}>{rejected.map(renderItem)}</View> : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44, gap: 8 },
  label: { flex: 1 }
});