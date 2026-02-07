import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

const data = [
  { name: "Other", percentage: 53.33, count: 533333 },
  { name: "Fizz (÷3)", percentage: 26.67, count: 266667 },
  { name: "Buzz (÷5)", percentage: 13.33, count: 133334 },
  { name: "FizzBuzz (÷15)", percentage: 6.67, count: 66666 },
];

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, percentage, count } = payload[0].payload;
  return (
    <div
      style={{
        background: "var(--background)",
        border: "1px solid var(--foreground)",
        borderRadius: "0.5rem",
        padding: "0.5rem 0.75rem",
        fontSize: "0.875rem",
        color: "var(--foreground)",
        opacity: 0.9,
      }}
    >
      <p style={{ fontWeight: 600, margin: 0 }}>{name}</p>
      <p style={{ margin: 0 }}>
        {percentage}% ({count.toLocaleString()} numbers)
      </p>
    </div>
  );
}

export default function DivisibilityDistribution() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    check();

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const textColor = isDark ? "#d4d4d8" : "#1f2937";
  const gridColor = isDark ? "#3f3f46" : "#d1d5db";
  const accentColor = isDark ? "#eab308" : "#3b82f6";

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={gridColor}
          horizontal={false}
        />
        <XAxis
          type="number"
          tick={{ fill: textColor, fontSize: 13 }}
          tickFormatter={(v: number) => `${v}%`}
          domain={[0, 60]}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: textColor, fontSize: 13 }}
          width={120}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{
            fill: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.05)",
          }}
        />
        <Bar dataKey="percentage" radius={[0, 4, 4, 0]} maxBarSize={36} fill={accentColor} />
      </BarChart>
    </ResponsiveContainer>
  );
}
