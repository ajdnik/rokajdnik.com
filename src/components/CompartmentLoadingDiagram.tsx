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
import { loadingCompartments, loadingData } from "./dive-chart-data";

const colors = [
  chartColors.accent,
  chartColors.foreground,
  chartColors.muted,
  chartColors.subtle,
];
const dashes = [undefined, undefined, "8 3", "3 3"];
const series: ChartSeries[] = [
  ...loadingCompartments.map((compartment, i) => ({
    key: compartment.key,
    name: `#${compartment.number} · ${compartment.halfTime} min`,
    color: colors[i],
    dash: dashes[i],
  })),
  {
    key: "inspired",
    name: "Inspired N₂",
    color: chartColors.subtle,
    dash: "6 4",
    stepAfter: true,
  },
];
const xTicks = [0, 30, 60, 90, 120, 150];
const yTicks = [1, 1.5, 2, 2.5, 3];

export default function CompartmentLoadingDiagram() {
  return (
    <DiveChart
      id="compartment-loading"
      title="How fast do the compartments load?"
      subtitle="30 m on air for 30 minutes, then 120 minutes at the surface"
      xLabel="Elapsed time (minutes)"
      yLabel="Nitrogen tension (bar)"
      data={loadingData}
      series={series}
      xKey="time"
      xDomain={[0, 150]}
      yDomain={[0.6, 3.3]}
      xTicks={xTicks}
      yTicks={yTicks}
      divider={30}
    >
      {(width) => (
        <LineChart
          width={width}
          height={chartHeight}
          data={loadingData}
          margin={{ top: 16, right: 14, bottom: 6, left: 0 }}
          accessibilityLayer
        >
          <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="time"
            domain={[0, 150]}
            ticks={xTicks}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            domain={[0.6, 3.3]}
            ticks={yTicks}
            tick={axisTick}
            tickFormatter={(value: number) => value.toFixed(1)}
            width={38}
            axisLine={false}
            tickLine={false}
          />
          <ReferenceLine
            x={30}
            stroke={chartColors.subtle}
            strokeDasharray="3 3"
            label={{
              value: "Surface",
              position: "insideTopRight",
              fill: chartColors.muted,
              fontSize: 11,
            }}
          />
          {series.map((line) => (
            <Line
              key={line.key}
              type={line.stepAfter ? "stepAfter" : "linear"}
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeDasharray={line.dash}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              isAnimationActive={false}
            />
          ))}
          <Tooltip<number, string>
            content={(props) => (
              <DiveChartTooltip
                {...props}
                formatLabel={(time) =>
                  `${time.toFixed(1)} min · ${time < 30 ? "at 30 m" : "at the surface"}`
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
