"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepTypeFields } from "@/components/pipeline-builder/StepTypeFields";
import { StepType } from "@/types/jenkins";
import type { Stage, Step, AgentType, EnvVar } from "@/types/jenkins";

interface StageEditorProps {
  stage: Stage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (stage: Stage) => void;
}

function createStep(type: StepType): Step {
  const id = crypto.randomUUID();
  switch (type) {
    case StepType.Shell:
      return { id, type, script: "" };
    case StepType.DockerBuild:
      return { id, type, image: "", tag: "latest", dockerfile: "Dockerfile" };
    case StepType.HelmDeploy:
      return { id, type, chart: "", release: "", namespace: "default" };
    case StepType.SonarScan:
      return { id, type, projectKey: "", sonarUrl: "http://sonar:9000" };
    case StepType.SlackNotify:
      return { id, type, channel: "#deployments", status: "good" };
  }
}

export function StageEditor({ stage, open, onOpenChange, onSave }: StageEditorProps) {
  const [draft, setDraft] = useState<Stage | null>(stage);

  if (!draft && stage) setDraft(stage);

  function handleOpenChange(o: boolean) {
    if (!o && draft) onSave(draft);
    onOpenChange(o);
  }

  if (!draft) return null;

  function updateField<K extends keyof Stage>(key: K, value: Stage[K]) {
    setDraft((d) => d ? { ...d, [key]: value } : d);
  }

  function addEnvVar() {
    const newVar: EnvVar = { id: crypto.randomUUID(), key: "", value: "" };
    updateField("envVars", [...draft!.envVars, newVar]);
  }

  function updateEnvVar(id: string, field: "key" | "value", value: string) {
    updateField(
      "envVars",
      draft!.envVars.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  }

  function removeEnvVar(id: string) {
    updateField("envVars", draft!.envVars.filter((e) => e.id !== id));
  }

  function addStep() {
    updateField("steps", [...draft!.steps, createStep(StepType.Shell)]);
  }

  function updateStep(updated: Step) {
    updateField(
      "steps",
      draft!.steps.map((s) => (s.id === updated.id ? updated : s))
    );
  }

  function removeStep(id: string) {
    updateField("steps", draft!.steps.filter((s) => s.id !== id));
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[480px] overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle className="text-foreground">Edit Stage</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Stage Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Build"
              className="bg-background dark:bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Agent</Label>
            <Select
              value={draft.agent}
              onValueChange={(v) => updateField("agent", v as AgentType)}
            >
              <SelectTrigger className="bg-background dark:bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">any</SelectItem>
                <SelectItem value="docker">docker</SelectItem>
                <SelectItem value="kubernetes">kubernetes</SelectItem>
                <SelectItem value="shell">shell</SelectItem>
                <SelectItem value="none">none</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(draft.agent === "docker" || draft.agent === "kubernetes") && (
            <div className="space-y-2">
              <Label className="text-foreground">Docker Image</Label>
              <Input
                value={draft.dockerImage ?? ""}
                onChange={(e) => updateField("dockerImage", e.target.value)}
                placeholder="node:18-alpine"
                className="bg-background dark:bg-background"
              />
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Environment Variables</Label>
              <Button variant="ghost" size="sm" onClick={addEnvVar} className="h-7 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {draft.envVars.map((env) => (
              <div key={env.id} className="flex gap-2">
                <Input
                  value={env.key}
                  onChange={(e) => updateEnvVar(env.id, "key", e.target.value)}
                  placeholder="KEY"
                  className="h-8 text-sm font-mono flex-1"
                />
                <Input
                  value={env.value}
                  onChange={(e) => updateEnvVar(env.id, "value", e.target.value)}
                  placeholder="value"
                  className="h-8 text-sm flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeEnvVar(env.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-foreground">Steps</Label>
              <Button variant="ghost" size="sm" onClick={addStep} className="h-7 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add Step
              </Button>
            </div>
            {draft.steps.map((step, idx) => (
              <div key={step.id} className="rounded-md border border-border p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">Step {idx + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStep(step.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Select
                  value={step.type}
                  onValueChange={(v) =>
                    updateStep(createStep(v as StepType))
                  }
                >
                  <SelectTrigger className="h-8 text-sm bg-background dark:bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={StepType.Shell}>Shell Script</SelectItem>
                    <SelectItem value={StepType.DockerBuild}>Docker Build</SelectItem>
                    <SelectItem value={StepType.HelmDeploy}>Helm Deploy</SelectItem>
                    <SelectItem value={StepType.SonarScan}>SonarQube Scan</SelectItem>
                    <SelectItem value={StepType.SlackNotify}>Slack Notify</SelectItem>
                  </SelectContent>
                </Select>
                <StepTypeFields step={step} onChange={updateStep} />
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-foreground">Post Actions</Label>
            <Tabs defaultValue="always">
              <TabsList>
                <TabsTrigger value="always">Always</TabsTrigger>
                <TabsTrigger value="success">Success</TabsTrigger>
                <TabsTrigger value="failure">Failure</TabsTrigger>
              </TabsList>
              <TabsContent value="always">
                <Textarea
                  value={draft.post.always}
                  onChange={(e) => updateField("post", { ...draft.post, always: e.target.value })}
                  placeholder="echo 'Build complete'"
                  className="mt-2 font-mono text-xs min-h-[80px]"
                />
              </TabsContent>
              <TabsContent value="success">
                <Textarea
                  value={draft.post.success}
                  onChange={(e) => updateField("post", { ...draft.post, success: e.target.value })}
                  placeholder="echo 'Build succeeded'"
                  className="mt-2 font-mono text-xs min-h-[80px]"
                />
              </TabsContent>
              <TabsContent value="failure">
                <Textarea
                  value={draft.post.failure}
                  onChange={(e) => updateField("post", { ...draft.post, failure: e.target.value })}
                  placeholder="echo 'Build failed'"
                  className="mt-2 font-mono text-xs min-h-[80px]"
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
