import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { IconButton, Modal, Portal, ProgressBar, Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CrossIcon from "../../assets/img/CROSS.svg";
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
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const maxDialogHeight = Math.max(0, windowHeight - insets.top - insets.bottom - 32);

  if (!visible || totalSlides === 0) {
    return null;
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modalContent}>
        <View style={styles.screen} pointerEvents="box-none">
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
            testID="explainer-backdrop"
          />
          <View
            pointerEvents="box-none"
            style={[styles.dialogPlacement, { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }]}
          >
            <View style={[styles.dialog, { maxHeight: maxDialogHeight }]} testID={testID}>
              <View style={styles.titleRow}>
                <Text variant="titleLarge" style={styles.dialogTitle} numberOfLines={1}>
                  {title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={labels.close}
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <CrossIcon width={24} height={24} fill={designTokens.colors.primary} />
                </Pressable>
              </View>
              <View style={styles.contentZone}>
                <ExplainerDialogContent slides={slides} labels={labels} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

interface ExplainerDialogContentProps {
  slides: ExplainerSlide[];
  labels: ExplainerDialogLabels;
}

function ExplainerDialogContent({
  slides,
  labels
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
        <IconButton
          icon="chevron-left"
          accessibilityLabel={labels.previous}
          containerColor={designTokens.colors.primary}
          iconColor="#FFF"
          disabled={isFirstSlide}
          onPress={() => setSlideIndex((previous) => Math.max(0, previous - 1))}
        />
        <IconButton
          icon="chevron-right"
          containerColor={designTokens.colors.primary}
          iconColor="#FFF"
          accessibilityLabel={labels.next}
          disabled={isLastSlide}
          onPress={() => setSlideIndex((previous) => Math.min(totalSlides - 1, previous + 1))}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    height: "100%",
    backgroundColor: "transparent",
    elevation: 0
  },
  screen: {
    flex: 1
  },
  dialogPlacement: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 16,
    paddingBottom: 16
  },
  dialog: {
    backgroundColor: designTokens.colors.primaryContainer,
    borderRadius: 7
  },
  titleRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 48
  },
  dialogTitle: {
    width: "100%",
    textAlign: "center"
  },
  contentZone: {
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: 12,
    paddingBottom: 12
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  contentRoot: {
    flexShrink: 1,
    minHeight: 0,
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
    flexGrow: 0,
    flexShrink: 1
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
    justifyContent: "space-between",
    marginTop: designTokens.spacing.xs
  }
});