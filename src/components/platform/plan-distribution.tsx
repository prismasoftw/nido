"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { PLAN_CATALOG } from "@/lib/plans";
import type { PlanCode } from "@/lib/supabase/types";

const PLAN_COLORS: Record<PlanCode, string> = {
  free: "#94a3b8",
  lite: "#6366f1",
  premium: "#4f46e5",
};

export function PlanDistribution({ byPlan }: { byPlan: Record<PlanCode, number> }) {
  const data = (Object.keys(byPlan) as PlanCode[])
    .map((code) => ({
      code,
      name: PLAN_CATALOG[code].name,
      value: byPlan[code],
    }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
        Sin datos todavía
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
              formatter={(value, name) => [value as number, name]}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.code} fill={PLAN_COLORS[d.code]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-semibold">{total}</span>
          <span className="text-muted-foreground text-xs">coworkings</span>
        </div>
      </div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.code} className="flex items-center gap-2 text-sm">
            <span
              className="size-3 rounded-full"
              style={{ background: PLAN_COLORS[d.code] }}
            />
            <span className="font-medium">{d.name}</span>
            <span className="text-muted-foreground">
              · {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
