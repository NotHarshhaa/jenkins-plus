"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDORABandColor } from "@/lib/utils";
import type { DORABand } from "@/types/jenkins";

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  band: DORABand;
  trend?: "up" | "down" | "neutral";
  isLoading?: boolean;
}

const bandLabel: Record<DORABand, string> = {
  elite: "Elite",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function MetricCard({ title, value, subtitle, band, trend }: MetricCardProps) {
  return (
    <Card className="bg-card dark:bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getDORABandColor(band)}`}>
          {bandLabel[band]}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          {trend && trend !== "neutral" && (
            trend === "up" ? (
              <TrendingUp className="mb-1 h-4 w-4 text-green-500 dark:text-green-400" />
            ) : (
              <TrendingDown className="mb-1 h-4 w-4 text-red-500 dark:text-red-400" />
            )
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
