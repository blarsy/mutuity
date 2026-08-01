import React from "react";

import { FormTextInput } from "./FormTextInput";

export interface AppTextFieldProps {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

export function AppTextField({
  label,
  value,
  onChangeText,
  placeholder,
  disabled,
  accessibilityLabel,
  testID
}: AppTextFieldProps): React.JSX.Element {
  const optionalProps = {
    ...(placeholder !== undefined ? { placeholder } : {}),
    ...(onChangeText !== undefined ? { onChangeText } : {}),
    ...(disabled !== undefined ? { disabled } : {}),
    ...(testID !== undefined ? { testID } : {})
  };

  return (
    <FormTextInput
      label={label}
      accessibilityLabel={accessibilityLabel ?? label}
      value={value}
      {...optionalProps}
    />
  );
}
