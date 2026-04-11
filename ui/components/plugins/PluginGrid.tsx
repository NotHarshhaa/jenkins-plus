"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PluginCard } from "@/components/plugins/PluginCard";
import { getPlugins } from "@/lib/jenkins";
import useSWR from "swr";
import type { Plugin, PluginCategory } from "@/types/jenkins";

const CATEGORIES: PluginCategory[] = ["SCM", "Pipeline", "Security", "Notification", "Quality"];

const MOCK_PLUGINS: Plugin[] = [
  { name: "Git Plugin", shortName: "git", version: "5.2.0", description: "Integrates Git SCM with Jenkins", category: "SCM", installCount: 280000, compatibilityStatus: "compatible", installed: true, url: "" },
  { name: "Pipeline", shortName: "workflow-aggregator", version: "2.7", description: "A suite of plugins that lets you orchestrate automation", category: "Pipeline", installCount: 250000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Blue Ocean", shortName: "blueocean", version: "1.27.11", description: "Blue Ocean is a new project that rethinks the Jenkins user experience", category: "Pipeline", installCount: 130000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "SonarQube Scanner", shortName: "sonar", version: "2.15", description: "This plugin allows easy integration of SonarQube", category: "Quality", installCount: 110000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Slack Notification", shortName: "slack", version: "2.50", description: "Integrates Jenkins to Slack, allows post build Slack notifications", category: "Notification", installCount: 120000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Role-based Authorization Strategy", shortName: "role-strategy", version: "633.v836e5b_3d5a_71", description: "Enables user authorization using a Role-Based strategy", category: "Security", installCount: 100000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Docker Plugin", shortName: "docker-plugin", version: "1.5", description: "This plugin allows to use a Docker host to dynamically provision agents", category: "Pipeline", installCount: 95000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Kubernetes Plugin", shortName: "kubernetes", version: "4029.v5712230ccb_f8", description: "Jenkins plugin to run dynamic agents in a Kubernetes cluster", category: "Pipeline", installCount: 88000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "LDAP Plugin", shortName: "ldap", version: "723.vd3452c0e5571", description: "Adds LDAP authentication to Jenkins", category: "Security", installCount: 85000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Email Extension Plugin", shortName: "email-ext", version: "2.104", description: "Allows configuring every aspect of email notifications", category: "Notification", installCount: 80000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "GitHub Integration", shortName: "github", version: "1.37.3.1", description: "GitHub plugin for Jenkins", category: "SCM", installCount: 200000, compatibilityStatus: "compatible", installed: false, url: "" },
  { name: "Maven Integration", shortName: "maven-plugin", version: "3.22", description: "Maven 2 project type and associated functionality", category: "Pipeline", installCount: 190000, compatibilityStatus: "deprecated", installed: false, url: "" },
];

export function PluginGrid() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | PluginCategory>("All");

  const { data: plugins, isLoading } = useSWR<Plugin[]>(
    "plugins",
    getPlugins,
    {
      fallbackData: MOCK_PLUGINS,
      onError: () => MOCK_PLUGINS,
    }
  );

  const displayPlugins = plugins ?? MOCK_PLUGINS;

  const filtered = displayPlugins.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeTab === "All" || p.category === activeTab;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search plugins..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "All" | PluginCategory)}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="All">All</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No plugins found matching your search
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((plugin) => (
                <PluginCard key={plugin.shortName} plugin={plugin} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
