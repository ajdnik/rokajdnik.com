import {
  CartesianGrid,
  Line,
  LineChart,
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
import { diveProfileData, formatDiveTime } from "./dive-profile-data";

const series: ChartSeries[] = [
  { key: "depth", name: "Depth", color: chartColors.accent },
];
const xTicks = [0, 5, 10, 15, 20, 25, 30];
const yTicks = [0, 5, 10, 15, 20, 25, 30];

export default function DiveProfileDiagram() {
  return (
    <DiveChart
      id="dive-profile"
      title="A multilevel dive, from surface to surface"
      subtitle="5 min at 25 m · 20 min at 10 m · 3 min safety stop at 5 m"
      xLabel="Elapsed time (minutes)"
      yLabel="Depth (metres)"
      data={diveProfileData}
      series={series}
      xKey="time"
      xDomain={[0, 33]}
      yDomain={[30, 0]}
      xTicks={xTicks}
      yTicks={yTicks}
      metrics={
        <dl className="dive-chart-metrics">
          <div>
            <dt>Total time</dt>
            <dd>31:45</dd>
          </div>
          <div>
            <dt>Descent</dt>
            <dd>20 m/min</dd>
          </div>
          <div>
            <dt>Ascent</dt>
            <dd>10 m/min</dd>
          </div>
        </dl>
      }
    >
      {(width) => (
        <LineChart
          width={width}
          height={chartHeight}
          data={diveProfileData}
          margin={{ top: 16, right: 14, bottom: 6, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="time"
            domain={[0, 33]}
            ticks={xTicks}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            domain={[0, 30]}
            reversed
            ticks={yTicks}
            tick={axisTick}
            width={38}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine
            y={5}
            stroke={chartColors.subtle}
            strokeDasharray="3 3"
            label={{
              value: "Safety stop · 3 min",
              position: "insideBottomLeft",
              fill: chartColors.muted,
              fontSize: 11,
            }}
          />
          <Line
            type="linear"
            dataKey="depth"
            name="Depth"
            stroke={chartColors.accent}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3 }}
            isAnimationActive={false}
          />
          <Tooltip<number, string>
            content={(props) => (
              <DiveChartTooltip
                {...props}
                formatLabel={(time) => `${formatDiveTime(time)} elapsed`}
                formatValue={(depth) => `${depth.toFixed(1)} m`}
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
