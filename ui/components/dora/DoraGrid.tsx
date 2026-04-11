"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/dora/MetricCard";
import { DeployFrequency } from "@/components/dora/charts/DeployFrequency";
import { LeadTime } from "@/components/dora/charts/LeadTime";
import { ChangeFailureRate } from "@/components/dora/charts/ChangeFailureRate";
import { MTTR } from "@/components/dora/charts/MTTR";
import { useDORA } from "@/hooks/useDORA";
import {
  computeDeployFrequency,
  computeLeadTime,
  computeCFR,
  computeMTTR,
} from "@/lib/dora";
import type { Build } from "@/types/jenkins";

interface DoraGridProps {
  builds: Build[];
  isLoading: boolean;
}

export function DoraGrid({ builds, isLoading }: DoraGridProps) {
  const metrics = useDORA(builds);
  const { value: dfValue, unit: dfUnit, dataPoints: dfData } = computeDeployFrequency(builds);
  const { dataPoints: ltData } = computeLeadTime(builds);
  const { dataPoints: cfrData } = computeCFR(builds);
  const { dataPoints: mttrData } = computeMTTR(builds);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Deploy Frequency"
          value={`${dfValue}/${dfUnit}`}
          subtitle="Successful deployments"
          band={metrics.band}
          trend="up"
        />
        <MetricCard
          title="Lead Time"
          value={`${metrics.leadTimeHours}h`}
          subtitle="Avg time to production"
          band={metrics.band}
          trend={metrics.leadTimeHours < 24 ? "up" : "down"}
        />
        <MetricCard
          title="Change Failure Rate"
          value={`${metrics.changeFailureRate}%`}
          subtitle="% of deployments causing failures"
          band={metrics.band}
          trend={metrics.changeFailureRate < 15 ? "up" : "down"}
        />
        <MetricCard
          title="MTTR"
          value={`${metrics.mttrHours}h`}
          subtitle="Mean time to restore service"
          band={metrics.band}
          trend={metrics.mttrHours < 24 ? "up" : "down"}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <DeployFrequency data={dfData} />
        <LeadTime data={ltData} />
        <ChangeFailureRate data={cfrData} />
        <MTTR data={mttrData} />
      </div>
    </div>
  );
}
