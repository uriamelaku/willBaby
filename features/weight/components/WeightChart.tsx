"use client";

import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

/** Weight by pregnancy week; time runs left to right like most charts, also in RTL. */
export function WeightChart({ points }: { points: { week: number; kg: number }[] }) {
  const t = useTranslations("weight");
  return (
    <div dir="ltr" className="h-52 w-full" role="img" aria-label={t("chartLabel")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--text)" strokeOpacity={0.1} vertical={false} />
          <XAxis
            dataKey="week"
            type="number"
            domain={[0, "dataMax"]}
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
          />
          <YAxis
            domain={["dataMin - 1", "dataMax + 1"]}
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
          />
          <Tooltip
            formatter={(kg) => [t("kg", { kg: Number(kg) }), ""]}
            labelFormatter={(week) => t("chartWeek", { week: Number(week) })}
            contentStyle={{ background: "var(--card)", border: "none", borderRadius: 12, color: "var(--text)" }}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="var(--brand)"
            strokeWidth={3}
            dot={{ r: 4, fill: "var(--brand)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
