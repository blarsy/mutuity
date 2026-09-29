import React, { useState } from "react";
import { ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Button, ProgressBar, Text } from "react-native-paper";

import { ThemedDialog } from "../primitives";
import { appFontFamilies } from "../../theme/fonts";
import { designTokens } from "../../theme/tokens";

/** Maximum height the dialog content may occupy, as a fraction of the screen height. */
const MAX_CONTENT_HEIGHT_RATIO = 0.9;

export interface ExplainerSlide {
  id: string;
  title: string;
  body: string;
}

export interface ExplainerDialogLabels {
  stepLabel: string;
  close: string;
  previous: string;
  next: string;
}

export interface ExplainerDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  slides: ExplainerSlide[];
  labels: ExplainerDialogLabels;
  testID?: string | undefined;
}

/**
 * Reusable multi-step explainer dialog. Renders a title, a progress bar, a
 * scrollable set of slides and Previous/Next/Close navigation. All text is
 * expected to be already translated by the caller.
 */
export function ExplainerDialog({
  visible,
  onClose,
  title,
  slides,
  labels,
  testID
}: ExplainerDialogProps): React.JSX.Element | null {
  const totalSlides = slides.length;

  if (totalSlides === 0) {
    return null;
  }

  return (
    <ThemedDialog
      visible={visible}
      title={title}
      onDismiss={onClose}
      testID={testID}
      content={<ExplainerDialogContent slides={slides} labels={labels} onClose={onClose} />}
      actions={[]}
    />
  );
}

interface ExplainerDialogContentProps {
  slides: ExplainerSlide[];
  labels: ExplainerDialogLabels;
  onClose: () => void;
}

function ExplainerDialogContent({
  slides,
  labels,
  onClose
}: ExplainerDialogContentProps): React.JSX.Element {
  const { height: windowHeight } = useWindowDimensions();
  const [slideIndex, setSlideIndex] = useState(0);
  const totalSlides = slides.length;

  // Measure the height of every slide so the dialog can be sized for the
  // largest content up front, avoiding abrupt vertical resizing between slides.
  const [measuredHeights, setMeasuredHeights] = useState<number[]>([]);

  const maxContentHeight = Math.max(0, windowHeight * MAX_CONTENT_HEIGHT_RATIO);
  const largestSlideHeight = measuredHeights.length > 0
    ? Math.max(...measuredHeights)
    : 0;
  const slidesHeight = largestSlideHeight > 0
    ? Math.min(largestSlideHeight, maxContentHeight)
    : undefined;

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
    <View style={styles.contentRoot}>
      <Text variant="labelSmall" style={styles.stepLabel}>
        {labels.stepLabel
          .replace("{{current}}", String(slideIndex + 1))
          .replace("{{total}}", String(totalSlides))}
      </Text>

      <ProgressBar
        progress={(slideIndex + 1) / totalSlides}
        color={designTokens.colors.primary}
        style={styles.progressBar}
      />

      <ScrollView
        style={[styles.slidesScroll, slidesHeight !== undefined ? { height: slidesHeight } : null]}
        contentContainerStyle={styles.slidesContent}
      >
        {slides.map((slide, index) => (
          <View
            key={slide.id}
            style={index === slideIndex ? styles.slideVisible : styles.slideHidden}
            onLayout={(event) => handleSlideLayout(index, event.nativeEvent.layout.height)}
          >
            <Text variant="titleMedium" style={styles.slideTitle}>
              {slide.title}
            </Text>
            <Text variant="bodyMedium" style={styles.slideBody}>
              {slide.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.actionsRow}>
        <Button onPress={onClose}>{labels.close}</Button>
        <Button
          disabled={isFirstSlide}
          onPress={() => setSlideIndex((previous) => Math.max(0, previous - 1))}
        >
          {labels.previous}
        </Button>
        <Button
          mode="contained"
          disabled={isLastSlide}
          onPress={() => setSlideIndex((previous) => Math.min(totalSlides - 1, previous + 1))}
        >
          {labels.next}
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
    flexGrow: 0
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