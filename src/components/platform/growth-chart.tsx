"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { GrowthPoint } from "@/lib/platform";

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground text-xs"
          tick={{ fill: "currentColor", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          width={32}
          className="text-muted-foreground text-xs"
          tick={{ fill: "currentColor", fontSize: 12 }}
        />
        <Tooltip
          cursor={{ stroke: "#4f46e5", strokeOpacity: 0.2 }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
          labelFormatter={(l) => `Mes: ${l}`}
          formatter={(value, name) => [
            value as number,
            name === "total" ? "Total acumulado" : "Nuevos",
          ]}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#4f46e5"
          strokeWidth={2.5}
          fill="url(#growthFill)"
          dot={{ r: 3, fill: "#4f46e5", strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
