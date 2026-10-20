import React from "react";
import { View } from "react-native";
import type { SvgProps } from "react-native-svg";

export function BellSvgMock(props: SvgProps): React.JSX.Element {
	return <View testID="bell-svg-mock" {...props} />;
}

export function DeniedSvgMock(props: SvgProps): React.JSX.Element {
	return <View testID="denied-svg-mock" {...props} />;
}

export function GoneSvgMock(props: SvgProps): React.JSX.Element {
	return <View testID="gone-svg-mock" {...props} />;
}

export function TimeUpSvgMock(props: SvgProps): React.JSX.Element {
	return <View testID="time-up-svg-mock" {...props} />;
}