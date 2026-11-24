export function normalizeCoordinate<T extends number | "">(value: number | string | null, fallback: T): number | T {
  const coordinate = typeof value === "number" ? value : Number.parseFloat(value ?? "");
  return Number.isFinite(coordinate) ? coordinate : fallback;
}