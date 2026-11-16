import React from "react";
import { Button, type ButtonProps } from "react-native-paper";

import { buttonStyles, getButtonFlavor, type ButtonFlavor } from "../../theme/buttonStyles";

export type AppButtonProps = ButtonProps & {
  flavor?: ButtonFlavor;
};

export function AppButton({ flavor, mode, textColor, buttonColor, style, ...props }: AppButtonProps): React.JSX.Element {
  const buttonStyle = buttonStyles[flavor ?? getButtonFlavor(mode)];

  return (
    <Button
      {...props}
      mode={mode ?? buttonStyle.mode}
      textColor={textColor ?? buttonStyle.fontColor}
      buttonColor={buttonColor ?? buttonStyle.backgroundColor}
      style={[
        style,
        {
          borderRadius: buttonStyle.roundness,
          borderWidth: buttonStyle.borderWidth,
          borderColor: buttonStyle.borderColor
        }
      ]}
    />
  );
}
