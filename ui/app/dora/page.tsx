"use client";

import { useBuilds } from "@/hooks/useBuilds";
import { DoraGrid } from "@/components/dora/DoraGrid";

export default function DoraPage() {
  const { jobs, isLoading } = useBuilds();

  const allBuilds = jobs.flatMap((j: import("@/types/jenkins").Job) => j.builds ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">DORA Metrics</h1>
        <p className="text-sm text-muted-foreground">
          DevOps Research and Assessment performance indicators
        </p>
      </div>
      <DoraGrid builds={allBuilds} isLoading={isLoading} />
    </div>
  );
}
