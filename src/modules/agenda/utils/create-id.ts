/** Lightweight id helper without extra deps (cuid-like enough for recurrence groups). */
export function createId(): string {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
