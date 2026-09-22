import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, ProgressBar, Text } from "react-native-paper";
import { useTranslation } from "react-i18next";

import { ThemedDialog } from "../primitives";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";
import { buildTokenExplainerSlides } from "../../features/tokenExplainer";

/** Maximum height the dialog content may occupy, as a fraction of the screen height. */
const MAX_CONTENT_HEIGHT_RATIO = 0.9;

export interface TokenExplainerDialogProps {
  visible: boolean;
  onClose: () => void;
  testID?: string;
}

export function TokenExplainerDialog({
  visible,
  onClose,
  testID
}: TokenExplainerDialogProps): React.JSX.Element | null {
  const { t } = useTranslation();

  const slides = useMemo(() => buildTokenExplainerSlides((key) => t(key, { defaultValue: key })), [t]);
  const totalSlides = slides.length;

  if (totalSlides === 0) {
    return null;
  }

  return (
    <ThemedDialog
      visible={visible}
      title={t("topesGuide.title", { ns: "us1", defaultValue: "Topes guide" })}
      onDismiss={onClose}
      testID={testID}
      content={
        <TokenExplainerDialogContent slides={slides} onClose={onClose} />
      }
      actions={[]}
    />
  );
}

interface TokenExplainerDialogContentProps {
  slides: ReturnType<typeof buildTokenExplainerSlides>;
  onClose: () => void;
}

function TokenExplainerDialogContent({
  slides,
  onClose
}: TokenExplainerDialogContentProps): React.JSX.Element {
  const { t } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const totalSlides = slides.length;

  // Measure the height of every slide so the dialog can be sized for the
  // largest content up front, avoiding abrupt vertical resizing between slides.
  const [measuredHeights, setMeasuredHeights] = useState<number[]>([]);

  const maxContentHeight = Math.max(0, windowHeight * MAX_CONTENT_HEIGHT_RATIO);
  const largestSlideHeight = measuredHeights.length === totalSlides
    ? Math.max(...measuredHeights)
    : 0;
  const contentHeight = Math.min(largestSlideHeight, maxContentHeight);

  const handleSlideLayout = (index: number, height: number): void => {
    setMeasuredHeights((previous) => {
      if (previous[index] === height) {
        return previous;
      }
      const next = [...previous];
      next[index] = height;
      return next;
    });
  };

  if (totalSlides === 0) {
    return <View />;
  }

  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex === totalSlides - 1;

  return (
    <View style={[styles.contentRoot, { height: contentHeight }]}>
      <Text variant="labelSmall" style={styles.stepLabel}>
        {t("topesGuide.stepLabel", {
          ns: "us1",
          defaultValue: "Step {{current}} of {{total}}",
          current: slideIndex + 1,
          total: totalSlides
        })}
      </Text>

      <ProgressBar
        progress={(slideIndex + 1) / totalSlides}
        color={designTokens.colors.primary}
        style={styles.progressBar}
      />

      <ScrollView style={styles.slidesScroll} contentContainerStyle={styles.slidesContent}>
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={index === slideIndex ? styles.slideVisible : styles.slideHidden}
            onLayout={(event) => handleSlideLayout(index, event.nativeEvent.layout.height)}
          >
            <Text variant="titleMedium" style={styles.slideTitle}>
              {t(slide.title, { ns: "us1", defaultValue: slide.title })}
            </Text>
            <Text variant="bodyMedium" style={styles.slideBody}>
              {t(slide.body, { ns: "us1", defaultValue: slide.body })}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionsRow}>
        <Button onPress={onClose}>{t("topesGuide.closeButton", { ns: "us1", defaultValue: "Close" })}</Button>
        <Button
          disabled={isFirstSlide}
          onPress={() => setSlideIndex((previous) => Math.max(0, previous - 1))}
        >
          {t("topesGuide.previousButton", { ns: "us1", defaultValue: "Previous" })}
        </Button>
        <Button
          mode="contained"
          disabled={isLastSlide}
          onPress={() => setSlideIndex((previous) => Math.min(totalSlides - 1, previous + 1))}
        >
          {t("topesGuide.nextButton", { ns: "us1", defaultValue: "Next" })}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contentRoot: {
    gap: designTokens.spacing.sm
  },
  stepLabel: {
    fontFamily: appFontFamilies.general,
    opacity: 0.7
  },
  progressBar: {
    height: 6,
    borderRadius: designTokens.radius.sm,
    backgroundColor: "#ffffff"
  },
  slidesScroll: {
    flex: 1
  },
  slidesContent: {
    gap: designTokens.spacing.sm
  },
  slideVisible: {
    gap: designTokens.spacing.sm
  },
  slideHidden: {
    position: "absolute",
    left: 0,
    right: 0,
    opacity: 0,
    gap: designTokens.spacing.sm
  },
  slideTitle: {
    fontFamily: appFontFamilies.altGeneral
  },
  slideBody: {
    fontFamily: appFontFamilies.general,
    opacity: 0.9
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: designTokens.spacing.xs,
    marginTop: designTokens.spacing.xs
  }
});
