import React from "react";
import type { PropsWithChildren } from "react";
import { StyleSheet } from "react-native";
import { Card } from "react-native-paper";

import { designTokens } from "../../theme/tokens";

export interface AppCardProps extends PropsWithChildren {
  accessibilityLabel?: string;
  testID?: string;
}

export function AppCard({ children, accessibilityLabel, testID }: AppCardProps): React.JSX.Element {
  const optionalProps = {
    ...(accessibilityLabel !== undefined ? { accessibilityLabel } : {}),
    ...(testID !== undefined ? { testID } : {})
  };

  return (
    <Card style={styles.card} {...optionalProps}>
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: designTokens.radius.md
  }
});
