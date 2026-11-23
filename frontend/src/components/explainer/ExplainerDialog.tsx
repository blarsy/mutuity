import { type ReactNode, useId, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Typography } from "@mui/material";

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

export interface ExplainerDialogProps<TSlide extends ExplainerSlide = ExplainerSlide> {
  visible: boolean;
  onClose: () => void;
  title: string;
  slides: TSlide[];
  labels: ExplainerDialogLabels;
  testID?: string;
  navigationMode?: "separate-close" | "next-closes";
  renderSlide?: (slide: TSlide) => ReactNode;
  renderProgress?: (current: number, total: number) => ReactNode;
}

/** Web port of the mobile reusable explainer, with already-translated copy. */
export function ExplainerDialog<TSlide extends ExplainerSlide>({
  visible,
  onClose,
  title,
  slides,
  labels,
  testID,
  navigationMode = "separate-close",
  renderSlide,
  renderProgress
}: ExplainerDialogProps<TSlide>) {
  const titleId = useId();
  if (!visible || slides.length === 0) return null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={titleId}
      data-testid={testID} PaperProps={{ sx: { maxHeight: "90dvh" } }}>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <ExplainerDialogContent
        slides={slides}
        labels={labels}
        onClose={onClose}
        navigationMode={navigationMode}
        renderSlide={renderSlide}
        renderProgress={renderProgress}
      />
    </Dialog>
  );
}

type ExplainerDialogContentProps<TSlide extends ExplainerSlide> = Pick<
  ExplainerDialogProps<TSlide>,
  "slides" | "labels" | "onClose" | "navigationMode" | "renderSlide" | "renderProgress"
>;

export function ExplainerDialogContent<TSlide extends ExplainerSlide>({
  slides,
  labels,
  onClose,
  navigationMode = "separate-close",
  renderSlide,
  renderProgress
}: ExplainerDialogContentProps<TSlide>) {
  const [requestedSlideIndex, setSlideIndex] = useState(0);
  if (slides.length === 0) return null;

  const slideIndex = Math.min(requestedSlideIndex, slides.length - 1);
  const isLastSlide = slideIndex === slides.length - 1;
  const stepLabel = labels.stepLabel
    .replace("{{current}}", String(slideIndex + 1))
    .replace("{{total}}", String(slides.length));

  const handleNext = () => {
    if (navigationMode === "next-closes" && isLastSlide) {
      onClose();
      return;
    }

    setSlideIndex(current => Math.min(slides.length - 1, current + 1));
  };

  return (
    <>
      <DialogContent>
        {navigationMode === "separate-close" ? (
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="caption">{stepLabel}</Typography>
            <LinearProgress aria-label={stepLabel} value={((slideIndex + 1) / slides.length) * 100}
              variant="determinate" sx={{ height: 6, borderRadius: 1, bgcolor: "common.white" }} />
          </Stack>
        ) : null}
        <Box sx={{ display: "grid", mt: navigationMode === "separate-close" ? 2 : 1 }} aria-live="polite">
          {slides.map((slide, index) => (
            <Box key={slide.id} aria-hidden={index !== slideIndex}
              sx={{ gridArea: "1 / 1", visibility: index === slideIndex ? "visible" : "hidden" }}>
              <Stack spacing={2}>
                {renderSlide ? renderSlide(slide) : (
                  <>
                    <Typography gutterBottom variant="h6">{slide.title}</Typography>
                    <Typography sx={{ whiteSpace: "pre-line", opacity: 0.9 }}>{slide.body}</Typography>
                  </>
                )}
                {renderProgress ? (
                  <Typography color="text.secondary" variant="caption">
                    {renderProgress(index + 1, slides.length)}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "flex-end", flexWrap: "wrap", gap: 1 }}>
        {navigationMode === "separate-close" ? (
          <Button onClick={onClose}>{labels.close}</Button>
        ) : null}
        <Button disabled={slideIndex === 0} onClick={() => setSlideIndex(current => Math.max(0, current - 1))}>
          {labels.previous}
        </Button>
        <Button
          disabled={navigationMode === "separate-close" && isLastSlide}
          onClick={handleNext}
          variant="contained"
        >
          {navigationMode === "next-closes" && isLastSlide ? labels.close : labels.next}
        </Button>
      </DialogActions>
    </>
  );
}