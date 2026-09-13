export function normalizeCoordinate(value: number | string | null, fallback: number): number {
  const coordinate = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(coordinate) ? coordinate : fallback;
}