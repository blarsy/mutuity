import React, { useState, type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { IconButton, Text } from "react-native-paper";

import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

export interface AccordionItemProps extends PropsWithChildren {
  title: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  initialExpanded?: boolean;
}

export function AccordionItem({
  title,
  style,
  testID,
  initialExpanded = false,
  children
}: AccordionItemProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <View style={[styles.root, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        testID={testID !== undefined ? `${testID}:Button` : undefined}
        onPress={() => setExpanded((previous) => !previous)}
      >
        <View style={styles.header}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <IconButton
            icon={expanded ? "chevron-up" : "chevron-right"}
            size={26}
            onPress={() => setExpanded((previous) => !previous)}
          />
        </View>
      </Pressable>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: designTokens.spacing.sm
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: designTokens.spacing.sm
  },
  title: {
    fontFamily: appFontFamilies.altGeneral
  },
  body: {
    marginTop: designTokens.spacing.sm
  }
});