"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { StageCard } from "@/components/pipeline-builder/StageCard";
import { StageEditor } from "@/components/pipeline-builder/StageEditor";
import { JenkinsfilePreview } from "@/components/pipeline-builder/JenkinsfilePreview";
import type { Stage, PipelineConfig, AgentType, EnvVar } from "@/types/jenkins";

function createStage(name: string): Stage {
  return {
    id: crypto.randomUUID(),
    name,
    agent: "any",
    envVars: [],
    steps: [],
    post: { always: "", success: "", failure: "" },
  };
}

const DEFAULT_CONFIG: PipelineConfig = {
  name: "my-pipeline",
  agent: "any",
  stages: [createStage("Checkout"), createStage("Build"), createStage("Test")],
  envVars: [],
};

export function PipelineCanvas() {
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_CONFIG);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setConfig((c: PipelineConfig) => {
        const oldIndex = c.stages.findIndex((s: Stage) => s.id === active.id);
        const newIndex = c.stages.findIndex((s: Stage) => s.id === over.id);
        return { ...c, stages: arrayMove(c.stages, oldIndex, newIndex) };
      });
    }
  }, []);

  function addStage() {
    const newStage = createStage(`Stage ${config.stages.length + 1}`);
    setConfig((c: PipelineConfig) => ({ ...c, stages: [...c.stages, newStage] }));
    setEditingStage(newStage);
    setEditorOpen(true);
  }

  function deleteStage(id: string) {
    setConfig((c: PipelineConfig) => ({ ...c, stages: c.stages.filter((s: Stage) => s.id !== id) }));
    if (editingStage?.id === id) {
      setEditorOpen(false);
      setEditingStage(null);
    }
  }

  function openEditor(stage: Stage) {
    setEditingStage(stage);
    setEditorOpen(true);
  }

  function saveStage(updated: Stage) {
    setConfig((c: PipelineConfig) => ({
      ...c,
      stages: c.stages.map((s: Stage) => (s.id === updated.id ? updated : s)),
    }));
    setEditingStage(updated);
  }

  function addEnvVar() {
    const newVar: EnvVar = { id: crypto.randomUUID(), key: "", value: "" };
    setConfig((c: PipelineConfig) => ({ ...c, envVars: [...c.envVars, newVar] }));
  }

  function updateEnvVar(id: string, field: "key" | "value", value: string) {
    setConfig((c: PipelineConfig) => ({
      ...c,
      envVars: c.envVars.map((e: EnvVar) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  }

  function removeEnvVar(id: string) {
    setConfig((c: PipelineConfig) => ({ ...c, envVars: c.envVars.filter((e: EnvVar) => e.id !== id) }));
  }

  return (
    <div className="flex h-full gap-0">
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card dark:bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="space-y-0.5">
              <Label className="text-xs text-muted-foreground">Pipeline Name</Label>
              <Input
                value={config.name}
                onChange={(e) => setConfig((c: PipelineConfig) => ({ ...c, name: e.target.value }))}
                className="h-8 w-48 text-sm bg-background dark:bg-background"
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-xs text-muted-foreground">Top-level Agent</Label>
              <Select
                value={config.agent}
                onValueChange={(v: string) => setConfig((c: PipelineConfig) => ({ ...c, agent: v as AgentType }))}
              >
                <SelectTrigger className="h-8 w-36 text-sm bg-background dark:bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">any</SelectItem>
                  <SelectItem value="docker">docker</SelectItem>
                  <SelectItem value="kubernetes">kubernetes</SelectItem>
                  <SelectItem value="none">none</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={addStage}>
              <Plus className="h-4 w-4" />
              Add Stage
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setPreviewOpen(true)}>
              <FileCode className="h-4 w-4" />
              Generate Jenkinsfile
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-4 overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={config.stages.map((s: Stage) => s.id)}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex items-start gap-3 min-w-max pb-4">
                {config.stages.map((stage) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    isActive={editingStage?.id === stage.id}
                    onDelete={deleteStage}
                    onEdit={openEditor}
                  />
                ))}
                {config.stages.length === 0 && (
                  <div className="flex h-32 w-48 items-center justify-center rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground">
                    No stages yet
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </ScrollArea>

        <Separator />

        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Global Environment Variables
            </Label>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={addEnvVar}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.envVars.map((env: EnvVar) => (
              <div key={env.id} className="flex gap-1">
                <Input
                  value={env.key}
                  onChange={(e) => updateEnvVar(env.id, "key", e.target.value)}
                  placeholder="KEY"
                  className="h-7 w-28 text-xs font-mono"
                />
                <Input
                  value={env.value}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateEnvVar(env.id, "value", e.target.value)}
                  placeholder="value"
                  className="h-7 w-36 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeEnvVar(env.id)}
                >
                  ×
                </Button>
              </div>
            ))}
            {config.envVars.length === 0 && (
              <span className="text-xs text-muted-foreground">No global env vars</span>
            )}
          </div>
        </div>
      </div>

      <StageEditor
        stage={editingStage}
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditingStage(null);
        }}
        onSave={saveStage}
      />

      <JenkinsfilePreview
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        config={config}
      />
    </div>
  );
}
