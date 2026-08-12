import React from "react";
import { Platform, StyleSheet } from "react-native";
import { TextInput, type TextInputProps } from "react-native-paper";

type FormTextInputTheme = NonNullable<TextInputProps["theme"]>;

export interface FormTextInputProps
  extends Omit<
    TextInputProps,
    | "mode"
    | "dense"
    | "underlineColor"
    | "activeUnderlineColor"
    | "textColor"
    | "placeholderTextColor"
    | "selectionColor"
    | "theme"
  > {
  inlineMode?: boolean;
  disableEmojis?: boolean;
  theme?: TextInputProps["theme"];
}

function resolveTheme(theme: TextInputProps["theme"]): FormTextInputTheme {
  if (!theme) {
    return { colors: { onSurfaceVariant: "#222" } } as FormTextInputTheme;
  }

  return {
    ...theme,
    colors: {
      onSurfaceVariant: "#222",
      ...(theme.colors ?? {})
    }
  } as FormTextInputTheme;
}

export function FormTextInput({
  inlineMode = false,
  disableEmojis = false,
  style,
  contentStyle,
  theme,
  keyboardType,
  ...rest
}: FormTextInputProps): React.JSX.Element {
  const resolvedKeyboardType = disableEmojis
    ? Platform.OS === "ios"
      ? "ascii-capable"
      : "visible-password"
    : keyboardType;

  const optionalProps = {
    ...(resolvedKeyboardType !== undefined ? { keyboardType: resolvedKeyboardType } : {})
  };

  return (
    <TextInput
      {...rest}
      {...optionalProps}
      dense={inlineMode}
      mode="flat"
      placeholderTextColor="#222"
      textColor="#000"
      underlineColor={inlineMode ? "transparent" : "#222"}
      activeUnderlineColor={inlineMode ? "transparent" : "#222"}
      selectionColor="transparent"
      theme={resolveTheme(theme)}
      contentStyle={[styles.content, inlineMode ? styles.inlineContent : null, contentStyle]}
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "transparent",
    marginTop: 0
  },
  content: {
    color: "#000"
  },
  inlineContent: {
    padding: 0
  }
});