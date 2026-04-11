"use client";

import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import type { StageFlowNode } from "@/types/jenkins";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StageTimelineProps {
  stages: StageFlowNode[];
  onStageClick?: (stageId: string) => void;
}

function stageStatusColor(status: StageFlowNode["status"]): string {
  switch (status) {
    case "SUCCESS":
      return "bg-green-500 dark:bg-green-600";
    case "FAILURE":
      return "bg-red-500 dark:bg-red-600";
    case "IN_PROGRESS":
      return "bg-blue-500 dark:bg-blue-600 animate-pulse";
    case "PAUSED":
      return "bg-amber-500 dark:bg-amber-600";
    case "ABORTED":
      return "bg-slate-400 dark:bg-slate-500";
    case "NOT_EXECUTED":
      return "bg-slate-200 dark:bg-slate-700";
  }
}

export function StageTimeline({ stages, onStageClick }: StageTimelineProps) {
  if (stages.length === 0) return null;

  return (
    <ScrollArea className="w-full">
      <div className="flex items-center gap-1 py-2 px-1 min-w-max overflow-x-auto">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center gap-1">
            {index > 0 && (
              <div className="h-px w-4 bg-border" />
            )}
            <button
              onClick={() => onStageClick?.(stage.id)}
              className={cn(
                "flex flex-col items-center gap-1 rounded px-3 py-2 text-xs transition-colors hover:bg-accent min-w-[80px]",
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  stageStatusColor(stage.status)
                )}
              />
              <span className="font-medium text-foreground truncate max-w-[80px]">
                {stage.name}
              </span>
              <span className="text-muted-foreground">
                {formatDuration(stage.durationMillis)}
              </span>
            </button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
