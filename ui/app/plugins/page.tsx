"use client";

import { PluginGrid } from "@/components/plugins/PluginGrid";

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Plugin Marketplace</h1>
        <p className="text-sm text-muted-foreground">
          Browse and install Jenkins plugins
        </p>
      </div>
      <PluginGrid />
    </div>
  );
}
