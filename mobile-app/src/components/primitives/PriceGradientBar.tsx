import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo, useRef } from "react";
import { Pressable, View, type GestureResponderEvent } from "react-native";
import { Icon } from "react-native-paper";

import { designTokens } from "../../theme/tokens";

interface PriceGradientBarProps {
  percent: number;
  barHeight?: number;
  testID?: string;
  onPercentChanged: (percent: number) => void;
}

export function PriceGradientBar({
  percent,
  barHeight = 20,
  testID,
  onPercentChanged
}: PriceGradientBarProps): React.JSX.Element {
  const widthRef = useRef(1);
  const lastPercentRef = useRef<number | null>(null);
  const displayPercent = Math.max(0, Math.min(percent, 100));
  const markerWidth = 30;
  const markerTop = Math.max(0, barHeight - 8);
  const markerDeltaToCenter = ((markerWidth / 4) / widthRef.current) * 100;
  const markerLeft = useMemo(
    () =>
      Math.max(
        Math.min(displayPercent - markerDeltaToCenter, 100 - markerDeltaToCenter * 2),
        markerDeltaToCenter
      ),
    [displayPercent, markerDeltaToCenter]
  );

  const handleLayout = (event: {
    nativeEvent: { layout: { width: number } };
  }): void => {
    const nextWidth = Math.max(1, event.nativeEvent.layout.width);
    if (widthRef.current === nextWidth && lastPercentRef.current === displayPercent) {
      return;
    }

    widthRef.current = nextWidth;
    lastPercentRef.current = displayPercent;
    onPercentChanged(displayPercent);
  };

  const handlePressIn = (event: GestureResponderEvent): void => {
    const x = event.nativeEvent.locationX;
    const width = widthRef.current;
    let nextPercent = (x / width) * 100;

    if (nextPercent < 0) {
      nextPercent = 0;
    }

    if (nextPercent > 100) {
      nextPercent = 100;
    }

    const normalizedPercent = Number(nextPercent.toFixed(2));
    if (lastPercentRef.current === normalizedPercent) {
      return;
    }

    lastPercentRef.current = normalizedPercent;
    onPercentChanged(normalizedPercent);
  };

  return (
    <Pressable
      testID={testID}
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      style={{ width: "100%", borderWidth: 1, borderColor: designTokens.colors.primary }}
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={["#fef0e3", "#fef0e3", "#ffb873", "#ffb873", "#ff770c", "#ff770c", "#ff4401", "#ff4401"]}
        locations={[0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1]}
        style={{ width: "100%", height: barHeight }}
      />

      <View
        style={{
          position: "absolute",
          width: "100%",
          left: `${markerLeft}%`,
          top: markerTop,
          transform: [{ translateX: -8 }]
        }}
      >
        <Icon source="chevron-up" size={markerWidth} />
      </View>
    </Pressable>
  );
}
