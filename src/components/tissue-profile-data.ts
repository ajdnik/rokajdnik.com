import { SURFACE_PRESSURE, WATER_VAPOUR, haldane } from "./dive-chart-data";
import { diveProfileSegments } from "./dive-profile-data";

// The same air-only ZH-L16C table as the article's complete Rust example.
const halfTimes = [
  5, 8, 12.5, 18.5, 27, 38.3, 54.3, 77, 109, 146, 187, 239, 305, 390, 498, 635,
];
const a = [
  1.1696, 1, 0.8618, 0.7562, 0.62, 0.5043, 0.441, 0.4, 0.375, 0.35, 0.3295,
  0.3065, 0.2835, 0.261, 0.248, 0.2327,
];
const b = [
  0.5578, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.891, 0.9092, 0.9222,
  0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653,
];
const nitrogen = (depth: number) =>
  0.79 * (SURFACE_PRESSURE + depth / 10 - WATER_VAPOUR);
export const profileDurationSeconds = Math.round(
  diveProfileSegments.reduce((sum, segment) => sum + segment.minutes, 0) * 60,
);

export function tissueStateAt(seconds: number) {
  let remaining = Math.max(0, Math.min(seconds, profileDurationSeconds)) / 60;
  let depth = 0;
  let tensions = halfTimes.map(() => nitrogen(0));
  for (const segment of diveProfileSegments) {
    if (remaining <= 0) break;
    const duration = Math.min(remaining, segment.minutes);
    const inspired = nitrogen(segment.start);
    const rate =
      (0.79 * (segment.end - segment.start)) / (10 * segment.minutes);
    tensions = tensions.map((initial, i) => {
      if (rate === 0) return haldane(initial, inspired, duration, halfTimes[i]);
      const k = Math.LN2 / halfTimes[i];
      return (
        inspired +
        rate * (duration - 1 / k) -
        (inspired - initial - rate / k) * Math.exp(-k * duration)
      );
    });
    depth =
      segment.start +
      ((segment.end - segment.start) * duration) / segment.minutes;
    remaining -= duration;
  }
  const ambient = SURFACE_PRESSURE + depth / 10;
  const inspired = nitrogen(depth);
  const tissues = tensions.map((tension, i) => ({
    number: i + 1,
    halfTime: halfTimes[i],
    tension,
    mValue: a[i] + ambient / b[i],
    direction:
      Math.abs(tension - inspired) < 1e-9
        ? "Equilibrium"
        : tension < inspired
          ? "On-gassing"
          : "Off-gassing",
  }));
  const ceiling = Math.max(
    0,
    ...tensions.map(
      (tension, i) => ((tension - a[i]) * b[i] - SURFACE_PRESSURE) * 10,
    ),
  );
  return { depth, ambient, inspired, tissues, ceiling };
}

// Piecewise scale: ambient pressure aligns at 60%, each tissue's M-value at 90%.
// This deliberately is not a shared absolute-pressure axis.
export function tissueBarPosition(
  pressure: number,
  ambient: number,
  mValue: number,
) {
  return pressure <= ambient
    ? (60 * pressure) / ambient
    : 60 + (30 * (pressure - ambient)) / (mValue - ambient);
}
