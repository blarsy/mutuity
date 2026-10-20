import React from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

export default function ClaimSvgMock(props: SvgProps): React.JSX.Element {
	return <View testID="claim-svg-mock" {...props} />;
}