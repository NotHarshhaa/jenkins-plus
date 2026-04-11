"use client";

import { useState } from "react";
import { Download, CheckCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { installPlugin } from "@/lib/jenkins";
import { toast } from "sonner";
import { truncate } from "@/lib/utils";
import type { Plugin } from "@/types/jenkins";

interface PluginCardProps {
  plugin: Plugin;
}

export function PluginCard({ plugin }: PluginCardProps) {
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(plugin.installed);
  const [progress, setProgress] = useState(0);

  async function handleInstall() {
    setInstalling(true);
    setProgress(10);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 400);
    try {
      await installPlugin(plugin.shortName);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setInstalled(true);
        setInstalling(false);
        toast.success(`${plugin.name} installed successfully`);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setInstalling(false);
      setProgress(0);
      toast.error(`Failed to install ${plugin.name}`);
    }
  }

  return (
    <Card className="flex flex-col bg-card dark:bg-card">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground leading-tight">
            {plugin.name}
          </h3>
          <div className="flex shrink-0 gap-1">
            <Badge variant="outline" className="text-[10px]">
              v{plugin.version}
            </Badge>
            {plugin.compatibilityStatus === "compatible" ? (
              <Badge variant="success" className="text-[10px]">
                Compatible
              </Badge>
            ) : plugin.compatibilityStatus === "deprecated" ? (
              <Badge variant="destructive" className="text-[10px]">
                Deprecated
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {truncate(plugin.description, 120)}
        </p>
        {plugin.installCount > 0 && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            {plugin.installCount.toLocaleString()} installs
          </p>
        )}
        {installing && (
          <Progress value={progress} className="mt-3 h-1.5" />
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {installed ? (
          <Button variant="outline" size="sm" className="w-full gap-2" disabled>
            <CheckCircle className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
            Installed
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="w-full gap-2"
            disabled={installing}
            onClick={handleInstall}
          >
            <Download className="h-3.5 w-3.5" />
            {installing ? "Installing..." : "Install"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
