import { useId, useState } from "react";
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

export interface ExplainerDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  slides: ExplainerSlide[];
  labels: ExplainerDialogLabels;
  testID?: string;
}

/** Web port of the mobile reusable explainer, with already-translated copy. */
export function ExplainerDialog({ visible, onClose, title, slides, labels, testID }: ExplainerDialogProps) {
  const titleId = useId();
  if (!visible || slides.length === 0) return null;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby={titleId}
      data-testid={testID} PaperProps={{ sx: { maxHeight: "90dvh" } }}>
      <DialogTitle id={titleId}>{title}</DialogTitle>
      <ExplainerDialogContent slides={slides} labels={labels} onClose={onClose} />
    </Dialog>
  );
}

export function ExplainerDialogContent({ slides, labels, onClose }: Pick<ExplainerDialogProps, "slides" | "labels" | "onClose">) {
  const [slideIndex, setSlideIndex] = useState(0);
  const bodyId = useId();
  if (slides.length === 0) return null;
  const stepLabel = labels.stepLabel.replace("{{current}}", String(slideIndex + 1)).replace("{{total}}", String(slides.length));

  return (
    <>
      <DialogContent>
        <Stack spacing={2}>
          <Typography color="text.secondary" variant="caption">{stepLabel}</Typography>
          <LinearProgress aria-label={stepLabel} value={((slideIndex + 1) / slides.length) * 100}
            variant="determinate" sx={{ height: 6, borderRadius: 1, bgcolor: "common.white" }} />
          {/* All slides size the same grid cell, matching mobile's largest-slide
              measurement without layout effects or fixed-height guesses. */}
          <Box sx={{ display: "grid" }} aria-live="polite" id={bodyId}>
            {slides.map((slide, index) => (
              <Box key={slide.id} aria-hidden={index !== slideIndex}
                sx={{ gridArea: "1 / 1", visibility: index === slideIndex ? "visible" : "hidden" }}>
                <Typography gutterBottom variant="h6">{slide.title}</Typography>
                <Typography sx={{ whiteSpace: "pre-line", opacity: 0.9 }}>{slide.body}</Typography>
              </Box>
            ))}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "flex-end", flexWrap: "wrap", gap: 1 }}>
        <Button onClick={onClose}>{labels.close}</Button>
        <Button disabled={slideIndex === 0} onClick={() => setSlideIndex(index => Math.max(0, index - 1))}>{labels.previous}</Button>
        <Button disabled={slideIndex === slides.length - 1}
          onClick={() => setSlideIndex(index => Math.min(slides.length - 1, index + 1))} variant="contained">{labels.next}</Button>
      </DialogActions>
    </>
  );
}