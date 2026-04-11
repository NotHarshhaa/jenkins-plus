"use client";

import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { RecentBuilds } from "@/components/dashboard/RecentBuilds";
import { useBuilds } from "@/hooks/useBuilds";

export default function DashboardPage() {
  const { jobs, isLoading } = useBuilds();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your Jenkins instance
        </p>
      </div>
      <SummaryCards jobs={jobs} isLoading={isLoading} />
      <RecentBuilds jobs={jobs} isLoading={isLoading} />
    </div>
  );
}
