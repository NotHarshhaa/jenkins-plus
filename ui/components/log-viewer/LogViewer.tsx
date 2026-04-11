"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Search, WrapText, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnsiLine } from "@/components/log-viewer/AnsiLine";
import type { LogLevel } from "@/types/jenkins";

interface LogViewerProps {
  log: string;
  isLoading: boolean;
  isBuilding: boolean;
}

export function LogViewer({ log, isLoading, isBuilding }: LogViewerProps) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");
  const [wordWrap, setWordWrap] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [log, autoScroll]);

  const lines = log.split("\n");

  const filteredLines = lines.filter((line) => {
    if (levelFilter !== "ALL") {
      const upper = line.toUpperCase();
      if (!upper.includes(levelFilter)) return false;
    }
    if (search && !line.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  function downloadLog() {
    const blob = new Blob([log], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "build.log";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading && !log) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? "w-3/4" : i % 2 === 0 ? "w-1/2" : "w-full"}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Select
          value={levelFilter}
          onValueChange={(v) => setLevelFilter(v as LogLevel | "ALL")}
        >
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ALL</SelectItem>
            <SelectItem value="INFO">INFO</SelectItem>
            <SelectItem value="WARN">WARN</SelectItem>
            <SelectItem value="ERROR">ERROR</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1.5">
          <Switch
            id="wrap"
            checked={wordWrap}
            onCheckedChange={setWordWrap}
            className="scale-75"
          />
          <Label htmlFor="wrap" className="text-xs text-muted-foreground cursor-pointer">
            <WrapText className="h-3.5 w-3.5" />
          </Label>
        </div>
        <div className="flex items-center gap-1.5">
          <Switch
            id="autoscroll"
            checked={autoScroll}
            onCheckedChange={setAutoScroll}
            className="scale-75"
          />
          <Label htmlFor="autoscroll" className="text-xs text-muted-foreground cursor-pointer">
            <ArrowDown className="h-3.5 w-3.5" />
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={downloadLog} className="h-8 gap-1">
          <Download className="h-3.5 w-3.5" />
        </Button>
        {isBuilding && (
          <span className="text-xs text-blue-500 dark:text-blue-400 animate-pulse">
            ● Live
          </span>
        )}
      </div>
      <ScrollArea className="flex-1 font-mono text-xs">
        <div className="p-4 space-y-0.5">
          {filteredLines.map((line, i) => (
            <AnsiLine
              key={i}
              lineNumber={i + 1}
              text={line}
              searchTerm={search}
              wrap={wordWrap}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
