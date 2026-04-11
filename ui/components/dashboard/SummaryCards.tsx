"use client";

import { Briefcase, Activity, Server, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Job } from "@/types/jenkins";

interface SummaryCardsProps {
  jobs: Job[];
  isLoading: boolean;
}

export function SummaryCards({ jobs, isLoading }: SummaryCardsProps) {
  const totalJobs = jobs.length;
  const runningBuilds = jobs.filter((j) => j.lastBuild?.building).length;
  const agentsOnline = jobs.reduce((acc, j) => {
    const builtOn = j.lastBuild?.builtOn;
    return builtOn && !acc.includes(builtOn) ? [...acc, builtOn] : acc;
  }, [] as string[]).length;

  const recentBuilds = jobs.flatMap((j) =>
    (j.builds ?? []).slice(0, 5)
  );
  const successBuilds = recentBuilds.filter((b) => b.result === "SUCCESS").length;
  const successRate =
    recentBuilds.length > 0
      ? Math.round((successBuilds / recentBuilds.length) * 100)
      : 0;

  const cards = [
    {
      title: "Total Jobs",
      value: totalJobs,
      icon: Briefcase,
      description: "Configured jobs",
      color: "text-blue-500 dark:text-blue-400",
    },
    {
      title: "Running Builds",
      value: runningBuilds,
      icon: Activity,
      description: "Currently executing",
      color: "text-green-500 dark:text-green-400",
    },
    {
      title: "Agents Online",
      value: agentsOnline || 1,
      icon: Server,
      description: "Active build nodes",
      color: "text-purple-500 dark:text-purple-400",
    },
    {
      title: "7-day Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      description: "Recent build health",
      color: "text-jenkins-red",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="bg-card dark:bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, description, color }) => (
        <Card key={title} className="bg-card dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <Icon className={`h-4 w-4 ${color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
