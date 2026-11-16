import React from "react";

import { AppButton } from "./AppButton";

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  accessibilityLabel,
  testID
}: PrimaryButtonProps): React.JSX.Element {
  const optionalProps = {
    ...(loading !== undefined ? { loading } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    ...(testID !== undefined ? { testID } : {})
  };

  return (
    <AppButton
      flavor="primary"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      {...optionalProps}
    >
      {label}
    </AppButton>
  );
}
