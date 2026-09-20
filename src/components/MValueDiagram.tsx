import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DiveChart,
  DiveChartTooltip,
  axisTick,
  chartColors,
  chartHeight,
  type ChartSeries,
} from "./DiveChart";
import {
  METRES_PER_BAR,
  SURFACE_PRESSURE,
  mValueData,
  mValueExample,
} from "./dive-chart-data";

const series: ChartSeries[] = [
  {
    key: "ambient",
    name: "Ambient · no supersaturation",
    color: chartColors.subtle,
    dash: "6 4",
  },
  {
    key: "mValue",
    name: "Raw M-value · a + P/b",
    color: chartColors.foreground,
  },
  { key: "allowed", name: "GF 30/70 allowance", color: chartColors.accent },
  {
    key: "tension",
    name: "Tissue tension",
    color: chartColors.muted,
    dash: "3 3",
  },
];
const xTicks = [1.5, 2, 2.5, 3];
const yTicks = [1, 1.5, 2, 2.5, 3, 3.5, 4];
const markers = [
  {
    x: mValueExample.rawCeiling,
    y: mValueExample.tension,
    color: chartColors.foreground,
  },
  {
    x: mValueExample.gfCeiling,
    y: mValueExample.tension,
    color: chartColors.accent,
  },
];

export default function MValueDiagram() {
  return (
    <DiveChart
      id="m-values"
      title="Where the tension meets the limit"
      subtitle="Compartment 2 · 40 m on air for 25 minutes · ZH-L16C"
      xLabel="Ambient pressure (bar)"
      yLabel="Tissue tension / allowed tension (bar)"
      data={mValueData}
      series={series}
      xKey="pressure"
      xDomain={[SURFACE_PRESSURE, SURFACE_PRESSURE + 2.3]}
      yDomain={[0.75, 4.25]}
      xTicks={xTicks}
      yTicks={yTicks}
      markers={markers}
      metrics={
        <dl className="dive-chart-metrics">
          <div>
            <dt>Tissue tension</dt>
            <dd>{mValueExample.tension.toFixed(2)} bar</dd>
          </div>
          <div>
            <dt>Raw ceiling</dt>
            <dd>{mValueExample.rawDepth.toFixed(1)} m</dd>
          </div>
          <div className="dive-chart-accent">
            <dt>GF 30/70 ceiling</dt>
            <dd>{mValueExample.gfDepth.toFixed(1)} m</dd>
          </div>
        </dl>
      }
    >
      {(width) => (
        <LineChart
          width={width}
          height={chartHeight}
          data={mValueData}
          margin={{ top: 12, right: 14, bottom: 6, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="pressure"
            domain={[SURFACE_PRESSURE, SURFACE_PRESSURE + 2.3]}
            ticks={xTicks}
            tick={axisTick}
            tickFormatter={(value: number) => value.toFixed(1)}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            domain={[0.75, 4.25]}
            ticks={yTicks}
            allowDataOverflow
            tick={axisTick}
            tickFormatter={(value: number) => value.toFixed(1)}
            width={38}
            axisLine={false}
            tickLine={false}
          />
          {series.map((line) => (
            <Line
              key={line.key}
              type="linear"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeDasharray={line.dash}
              strokeWidth={line.key === "allowed" ? 2.5 : 2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
          {markers.map((marker) => (
            <ReferenceLine
              key={marker.x}
              segment={[
                { x: marker.x, y: 0.75 },
                { x: marker.x, y: marker.y },
              ]}
              stroke={marker.color}
              strokeDasharray="3 3"
            />
          ))}
          {markers.map((marker) => (
            <ReferenceDot
              key={marker.x}
              x={marker.x}
              y={marker.y}
              r={4}
              fill={marker.color}
              stroke="var(--code-bg)"
            />
          ))}
          <Tooltip<number, string>
            content={(props) => (
              <DiveChartTooltip
                {...props}
                formatLabel={(pressure) =>
                  `${pressure.toFixed(3)} bar · ${((pressure - SURFACE_PRESSURE) * METRES_PER_BAR).toFixed(1)} m`
                }
              />
            )}
            isAnimationActive={false}
            cursor={{ stroke: chartColors.muted, strokeDasharray: "3 3" }}
          />
        </LineChart>
      )}
    </DiveChart>
  );
}
