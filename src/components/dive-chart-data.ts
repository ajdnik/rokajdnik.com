// Fixed educational examples from Parts 1 and 3, not a dive-planning interface.
export const SURFACE_PRESSURE = 1.01325;
export const WATER_VAPOUR = 0.0627;
export const METRES_PER_BAR = 10;
const AIR_NITROGEN = 0.79;

export function haldane(
  initial: number,
  inspired: number,
  minutes: number,
  halfTime: number,
) {
  return inspired + (initial - inspired) * 2 ** (-minutes / halfTime);
}

export const loadingCompartments = [
  { key: "compartment1", number: 1, halfTime: 4 },
  { key: "compartment5", number: 5, halfTime: 27 },
  { key: "compartment9", number: 9, halfTime: 109 },
  { key: "compartment16", number: 16, halfTime: 635 },
] as const;

export type ChartPoint = Record<string, number>;
const surfaceNitrogen = AIR_NITROGEN * (SURFACE_PRESSURE - WATER_VAPOUR);
const bottomNitrogen =
  AIR_NITROGEN * (SURFACE_PRESSURE + 30 / METRES_PER_BAR - WATER_VAPOUR);

export const loadingData: ChartPoint[] = Array.from({ length: 301 }, (_, i) => {
  const time = i / 2;
  const point: ChartPoint = {
    time,
    inspired: time < 30 ? bottomNitrogen : surfaceNitrogen,
  };
  for (const compartment of loadingCompartments) {
    const bottomTension = haldane(
      surfaceNitrogen,
      bottomNitrogen,
      Math.min(time, 30),
      compartment.halfTime,
    );
    point[compartment.key] =
      time <= 30
        ? bottomTension
        : haldane(
            bottomTension,
            surfaceNitrogen,
            time - 30,
            compartment.halfTime,
          );
  }
  return point;
});

// Compartment 2 controls both the raw and low-GF ceilings for this particular
// C-table example: instantaneous descent, then 40 m / 25 min on air.
const halfTime = 8;
const a = 1;
const b = 0.6514;
const low = 0.3;
const high = 0.7;
const tension = haldane(
  surfaceNitrogen,
  AIR_NITROGEN * (SURFACE_PRESSURE + 4 - WATER_VAPOUR),
  25,
  halfTime,
);
const rawCeiling = (tension - a) * b;
const reference = (tension - low * a) / (1 - low + low / b);

export function gradientFactorAt(pressure: number) {
  const fraction = Math.max(
    0,
    Math.min(1, (reference - pressure) / (reference - SURFACE_PRESSURE)),
  );
  return low + (high - low) * fraction;
}

export function allowedTension(pressure: number) {
  return pressure + gradientFactorAt(pressure) * (a + pressure / b - pressure);
}

export const mValueExample = {
  tension,
  rawCeiling,
  gfCeiling: reference,
  rawDepth: (rawCeiling - SURFACE_PRESSURE) * METRES_PER_BAR,
  gfDepth: (reference - SURFACE_PRESSURE) * METRES_PER_BAR,
};

// Include the two exact intersections as well as evenly spaced samples.
const pressures = [
  ...new Set([
    ...Array.from(
      { length: 201 },
      (_, i) => SURFACE_PRESSURE + (i * 2.3) / 200,
    ),
    rawCeiling,
    reference,
  ]),
].sort((left, right) => left - right);

export const mValueData: ChartPoint[] = pressures.map((pressure) => ({
  pressure,
  ambient: pressure,
  mValue: a + pressure / b,
  allowed: allowedTension(pressure),
  tension,
}));
