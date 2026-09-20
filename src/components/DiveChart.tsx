import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { TooltipContentProps } from "recharts";
import type { ChartPoint } from "./dive-chart-data";
import "./DiveChart.css";

export const chartColors = {
  accent: "var(--accent)",
  foreground: "var(--foreground)",
  muted: "color-mix(in srgb, var(--foreground) 75%, transparent)",
  subtle: "color-mix(in srgb, var(--foreground) 55%, transparent)",
  grid: "color-mix(in srgb, var(--foreground) 14%, transparent)",
};

export const chartHeight = 320;
export const axisTick = { fill: chartColors.muted, fontSize: 11 };

export type ChartSeries = {
  key: string;
  name: string;
  color: string;
  dash?: string;
  stepAfter?: boolean;
};

type Plot = {
  data: ChartPoint[];
  series: ChartSeries[];
  xKey: string;
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: number[];
  yTicks: number[];
  markers?: { x: number; y: number; color: string }[];
  divider?: number;
};

// Recharts 3 does not emit its plot during SSR. This small SVG fallback uses
// exactly the same samples, scales and series as the hydrated chart.
function StaticPlot({ title, ...plot }: Plot & { title: string }) {
  const clipId = useId();
  const left = 46,
    right = 704,
    top = 12,
    bottom = 286;
  const x = (value: number) =>
    left +
    ((value - plot.xDomain[0]) / (plot.xDomain[1] - plot.xDomain[0])) *
      (right - left);
  const y = (value: number) =>
    bottom -
    ((value - plot.yDomain[0]) / (plot.yDomain[1] - plot.yDomain[0])) *
      (bottom - top);
  return (
    <svg
      className="dive-chart-static"
      viewBox="0 0 720 320"
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={left} y={top} width={right - left} height={bottom - top} />
        </clipPath>
      </defs>
      {plot.yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={left}
            x2={right}
            y1={y(tick)}
            y2={y(tick)}
            stroke={chartColors.grid}
            strokeDasharray="3 3"
          />
          <text
            x={left - 8}
            y={y(tick) + 4}
            textAnchor="end"
            fill={chartColors.muted}
            fontSize={11}
          >
            {tick.toFixed(1)}
          </text>
        </g>
      ))}
      {plot.xTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={x(tick)}
            x2={x(tick)}
            y1={top}
            y2={bottom}
            stroke={chartColors.grid}
            strokeDasharray="3 3"
          />
          <text
            x={x(tick)}
            y={bottom + 20}
            textAnchor="middle"
            fill={chartColors.muted}
            fontSize={11}
          >
            {Number(tick.toFixed(1))}
          </text>
        </g>
      ))}
      <g clipPath={`url(#${clipId})`}>
        {plot.divider !== undefined && (
          <line
            x1={x(plot.divider)}
            x2={x(plot.divider)}
            y1={top}
            y2={bottom}
            stroke={chartColors.subtle}
            strokeDasharray="3 3"
          />
        )}
        {plot.series.map((series) => {
          const path = plot.data
            .map((point, i) => {
              const px = x(point[plot.xKey]).toFixed(2),
                py = y(point[series.key]).toFixed(2);
              return i === 0
                ? `M ${px},${py}`
                : series.stepAfter
                  ? `H ${px} V ${py}`
                  : `L ${px},${py}`;
            })
            .join(" ");
          return (
            <path
              key={series.key}
              d={path}
              fill="none"
              stroke={series.color}
              strokeWidth={2}
              strokeDasharray={series.dash}
            />
          );
        })}
        {plot.markers?.map((marker) => (
          <g key={marker.x}>
            <line
              x1={x(marker.x)}
              x2={x(marker.x)}
              y1={y(marker.y)}
              y2={bottom}
              stroke={marker.color}
              strokeDasharray="3 3"
            />
            <circle
              cx={x(marker.x)}
              cy={y(marker.y)}
              r={4}
              fill={marker.color}
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function DiveChart({
  id,
  title,
  subtitle,
  xLabel,
  yLabel,
  metrics,
  children,
  ...plot
}: Plot & {
  id: string;
  title: string;
  subtitle: string;
  xLabel: string;
  yLabel: string;
  metrics?: ReactNode;
  children: (width: number) => ReactNode;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () =>
      setWidth(Math.floor(element.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="dive-chart" data-chart={id} role="group" aria-label={title}>
      <div className="dive-chart-heading">{title}</div>
      <p className="dive-chart-subtitle">{subtitle}</p>
      {metrics}
      <p className="dive-chart-axis-label">{yLabel}</p>
      <div
        className={`dive-chart-plot${width > 0 ? "" : " dive-chart-fallback"}`}
        ref={container}
      >
        {width > 0 ? children(width) : <StaticPlot {...plot} title={title} />}
      </div>
      <p className="dive-chart-axis-label dive-chart-x-label">{xLabel}</p>
      <ul className="dive-chart-legend" aria-label="Chart legend">
        {plot.series.map((series) => (
          <li key={series.key}>
            <svg width="24" height="12" aria-hidden="true">
              <line
                x1="0"
                x2="24"
                y1="6"
                y2="6"
                stroke={series.color}
                strokeWidth={2}
                strokeDasharray={series.dash}
              />
            </svg>
            <span>{series.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DiveChartTooltip({
  active,
  payload,
  label,
  formatLabel,
}: TooltipContentProps<number, string> & {
  formatLabel: (value: number) => string;
}) {
  if (!active || !payload?.length || label === undefined) return null;
  return (
    <div className="dive-chart-tooltip">
      <p>{formatLabel(Number(label))}</p>
      <ul>
        {payload.map((entry) => (
          <li key={String(entry.dataKey)}>
            <span>{entry.name}</span>
            <strong>{Number(entry.value).toFixed(3)} bar</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
