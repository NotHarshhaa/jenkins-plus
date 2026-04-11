"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DORADataPoint } from "@/types/jenkins";

interface MTTRProps {
  data: DORADataPoint[];
  teamTarget?: number;
}

export function MTTR({ data, teamTarget = 24 }: MTTRProps) {
  return (
    <Card className="bg-card dark:bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-foreground">
          Mean Time to Restore (hours)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
                fontSize: "12px",
                color: "hsl(var(--popover-foreground))",
              }}
            />
            <ReferenceLine
              y={teamTarget}
              stroke="hsl(var(--warning))"
              strokeDasharray="4 4"
              label={{ value: `Target: ${teamTarget}h`, fill: "hsl(var(--warning))", fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
