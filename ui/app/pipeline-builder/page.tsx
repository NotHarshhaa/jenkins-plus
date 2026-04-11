"use client";

import { PipelineCanvas } from "@/components/pipeline-builder/PipelineCanvas";

export default function PipelineBuilderPage() {
  return (
    <div className="flex h-full flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline Builder</h1>
        <p className="text-sm text-muted-foreground">
          Drag, drop and configure stages to build your Jenkinsfile
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <PipelineCanvas />
      </div>
    </div>
  );
}
