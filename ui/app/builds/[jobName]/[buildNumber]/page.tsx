"use client";

import { use, useState, useEffect } from "react";
import { getBuild, getStageFlow } from "@/lib/jenkins";
import { useBuildLog } from "@/hooks/useBuildLog";
import { LogViewer } from "@/components/log-viewer/LogViewer";
import { StageTimeline } from "@/components/log-viewer/StageTimeline";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatAgo, getBadgeVariant, buildStatusLabel } from "@/lib/utils";
import type { Build, StageFlowNode } from "@/types/jenkins";

interface PageProps {
  params: Promise<{ jobName: string; buildNumber: string }>;
}

export default function BuildDetailPage({ params }: PageProps) {
  const { jobName, buildNumber } = use(params);
  const decodedJob = decodeURIComponent(jobName);
  const buildNum = parseInt(buildNumber, 10);

  const [build, setBuild] = useState<Build | null>(null);
  const [stages, setStages] = useState<StageFlowNode[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  useEffect(() => {
    setIsLoadingMeta(true);
    Promise.all([
      getBuild(decodedJob, buildNum),
      getStageFlow(decodedJob, buildNum),
    ])
      .then(([b, s]) => {
        setBuild(b);
        setStages(s);
      })
      .finally(() => setIsLoadingMeta(false));
  }, [decodedJob, buildNum]);

  const { log, isLoading: isLogLoading } = useBuildLog(
    decodedJob,
    buildNum,
    build?.building ?? true
  );

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center gap-4">
        {isLoadingMeta ? (
          <>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-5 w-20" />
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-foreground">
              {decodedJob} #{buildNumber}
            </h1>
            {build && (
              <Badge variant={getBadgeVariant(build.building ? "building" : build.result)}>
                {buildStatusLabel(build.result, build.building)}
              </Badge>
            )}
            {build && (
              <span className="text-sm text-muted-foreground">
                {formatDuration(build.duration)} · {formatAgo(build.timestamp)}
              </span>
            )}
          </>
        )}
      </div>

      {stages.length > 0 && (
        <StageTimeline stages={stages} />
      )}

      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-card">
        <LogViewer
          log={log}
          isLoading={isLogLoading}
          isBuilding={build?.building ?? true}
        />
      </div>
    </div>
  );
}
