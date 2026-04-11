"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StepType } from "@/types/jenkins";
import type { Step, ShellStep, DockerBuildStep, HelmDeployStep, SonarScanStep, SlackNotifyStep } from "@/types/jenkins";

interface StepTypeFieldsProps {
  step: Step;
  onChange: (updated: Step) => void;
}

export function StepTypeFields({ step, onChange }: StepTypeFieldsProps) {
  switch (step.type) {
    case StepType.Shell: {
      const s = step as ShellStep;
      return (
        <div className="space-y-2">
          <Label className="text-foreground">Shell Script</Label>
          <Textarea
            value={s.script}
            onChange={(e) => onChange({ ...s, script: e.target.value })}
            placeholder="npm ci && npm test"
            className="font-mono text-xs min-h-[100px]"
          />
        </div>
      );
    }

    case StepType.DockerBuild: {
      const s = step as DockerBuildStep;
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Image</Label>
              <Input
                value={s.image}
                onChange={(e) => onChange({ ...s, image: e.target.value })}
                placeholder="myapp"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Tag</Label>
              <Input
                value={s.tag}
                onChange={(e) => onChange({ ...s, tag: e.target.value })}
                placeholder="latest"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-foreground text-xs">Dockerfile Path</Label>
            <Input
              value={s.dockerfile}
              onChange={(e) => onChange({ ...s, dockerfile: e.target.value })}
              placeholder="Dockerfile"
              className="h-8 text-sm"
            />
          </div>
        </div>
      );
    }

    case StepType.HelmDeploy: {
      const s = step as HelmDeployStep;
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-foreground text-xs">Chart</Label>
            <Input
              value={s.chart}
              onChange={(e) => onChange({ ...s, chart: e.target.value })}
              placeholder="./charts/myapp"
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Release Name</Label>
              <Input
                value={s.release}
                onChange={(e) => onChange({ ...s, release: e.target.value })}
                placeholder="myapp-prod"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-foreground text-xs">Namespace</Label>
              <Input
                value={s.namespace}
                onChange={(e) => onChange({ ...s, namespace: e.target.value })}
                placeholder="production"
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      );
    }

    case StepType.SonarScan: {
      const s = step as SonarScanStep;
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-foreground text-xs">Project Key</Label>
            <Input
              value={s.projectKey}
              onChange={(e) => onChange({ ...s, projectKey: e.target.value })}
              placeholder="my-project"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-foreground text-xs">SonarQube URL</Label>
            <Input
              value={s.sonarUrl}
              onChange={(e) => onChange({ ...s, sonarUrl: e.target.value })}
              placeholder="http://sonar:9000"
              className="h-8 text-sm"
            />
          </div>
        </div>
      );
    }

    case StepType.SlackNotify: {
      const s = step as SlackNotifyStep;
      return (
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-foreground text-xs">Channel</Label>
            <Input
              value={s.channel}
              onChange={(e) => onChange({ ...s, channel: e.target.value })}
              placeholder="#deployments"
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-foreground text-xs">Status</Label>
            <Select
              value={s.status}
              onValueChange={(v) => onChange({ ...s, status: v as SlackNotifyStep["status"] })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good">good (green)</SelectItem>
                <SelectItem value="warning">warning (yellow)</SelectItem>
                <SelectItem value="danger">danger (red)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
  }
}
