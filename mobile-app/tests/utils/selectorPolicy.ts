export const semanticSelectorPolicy = {
  preferred: ["getByRole", "getByLabelText", "getByPlaceholderText"],
  fallback: ["getByTestId"],
  forbidden: ["textTraversal", "internalProps", "snapshotOnly"]
} as const;

export function describeSelectorFallback(reason: string, testId: string): string {
  return `Fallback to getByTestId(${testId}) because ${reason}`;
}
