"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Hammer, GitBranch, BarChart3, Puzzle, Settings, LayoutDashboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBuilds } from "@/hooks/useBuilds";
import { triggerBuild } from "@/lib/jenkins";
import { toast } from "sonner";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const staticItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigate" },
  { label: "Pipeline Builder", href: "/pipeline-builder", icon: GitBranch, group: "Navigate" },
  { label: "Builds", href: "/builds", icon: Hammer, group: "Navigate" },
  { label: "DORA Metrics", href: "/dora", icon: BarChart3, group: "Navigate" },
  { label: "Plugins", href: "/plugins", icon: Puzzle, group: "Navigate" },
  { label: "Settings", href: "/settings", icon: Settings, group: "Navigate" },
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { jobs } = useBuilds();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const jobItems = jobs.map((j) => ({
    label: j.displayName ?? j.name,
    href: `/builds?job=${encodeURIComponent(j.name)}`,
    jobName: j.name,
    icon: Hammer,
    group: "Jobs",
  }));

  const allItems = [...staticItems, ...jobItems];
  const filtered = query.trim()
    ? allItems.filter((i) =>
        i.label.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  const grouped: Record<string, typeof filtered> = {};
  for (const item of filtered) {
    grouped[item.group] = grouped[item.group] ?? [];
    grouped[item.group].push(item);
  }

  function navigate(href: string) {
    router.push(href);
    onOpenChange(false);
  }

  async function handleTrigger(jobName: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await triggerBuild(jobName);
      toast.success(`Build triggered for ${jobName}`);
      onOpenChange(false);
    } catch {
      toast.error(`Failed to trigger build for ${jobName}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        <div className="flex items-center border-b border-border px-4 py-3 gap-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, navigate..."
            className="border-0 p-0 shadow-none focus-visible:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </p>
              {items.map((item) => (
                <button
                  key={item.href}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => navigate(item.href)}
                >
                  <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {"jobName" in item && (
                    <button
                      className="rounded px-2 py-0.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={(e) => handleTrigger((item as { jobName: string }).jobName, e)}
                    >
                      Run
                    </button>
                  )}
                </button>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &quot;{query}&quot;
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
