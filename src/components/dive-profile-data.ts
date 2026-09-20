import type { ChartPoint } from "./dive-chart-data";

// The fixed multilevel example in Part 1. Durations include all travel.
const descentRate = 20;
const ascentRate = 10;
export const diveProfileSegments = [
  { start: 0, end: 25, minutes: 25 / descentRate },
  { start: 25, end: 25, minutes: 5 },
  { start: 25, end: 10, minutes: 15 / ascentRate },
  { start: 10, end: 10, minutes: 20 },
  { start: 10, end: 5, minutes: 5 / ascentRate },
  { start: 5, end: 5, minutes: 3 },
  { start: 5, end: 0, minutes: 5 / ascentRate },
] as const;

export const diveProfileData: ChartPoint[] = [{ time: 0, depth: 0 }];
let elapsed = 0;
for (const segment of diveProfileSegments) {
  const steps = Math.ceil(segment.minutes * 60);
  for (let step = 1; step <= steps; step++) {
    const fraction = step / steps;
    diveProfileData.push({
      time: elapsed + segment.minutes * fraction,
      depth: segment.start + (segment.end - segment.start) * fraction,
    });
  }
  elapsed += segment.minutes;
}

export function formatDiveTime(minutes: number) {
  const seconds = Math.round(minutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
