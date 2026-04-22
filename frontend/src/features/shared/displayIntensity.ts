export type DisplayIntensity = "leg_up" | "sharing" | "commitment" | "rare_contribution";

const intensityTranslationKeyByValue: Record<DisplayIntensity, string> = {
  leg_up: "form.intensityLegUp",
  sharing: "form.intensitySharing",
  commitment: "form.intensityCommitment",
  rare_contribution: "form.intensityRareContribution"
};

export function getDisplayIntensityLabel(
  intensity: DisplayIntensity,
  t: (key: string, options?: Record<string, unknown>) => string
) {
  return t(intensityTranslationKeyByValue[intensity]);
}