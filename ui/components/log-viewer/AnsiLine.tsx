"use client";

import { useMemo } from "react";
import AnsiToHtml from "ansi-to-html";
import { cn } from "@/lib/utils";

const converter = new AnsiToHtml({ escapeXML: true, newline: false });

interface AnsiLineProps {
  lineNumber: number;
  text: string;
  searchTerm?: string;
  wrap?: boolean;
}

function detectLevel(text: string): string {
  const upper = text.toUpperCase();
  if (upper.includes("ERROR") || upper.includes("FATAL")) return "ERROR";
  if (upper.includes("WARN")) return "WARN";
  if (upper.includes("INFO")) return "INFO";
  return "";
}

function highlightSearch(html: string, term: string): string {
  if (!term.trim()) return html;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return html.replace(
    new RegExp(`(${escaped})`, "gi"),
    "<mark>$1</mark>"
  );
}

export function AnsiLine({ lineNumber, text, searchTerm = "", wrap = false }: AnsiLineProps) {
  const level = detectLevel(text);

  const htmlContent = useMemo(() => {
    try {
      const converted = converter.toHtml(text);
      return highlightSearch(converted, searchTerm);
    } catch {
      return highlightSearch(text, searchTerm);
    }
  }, [text, searchTerm]);

  if (!text.trim()) {
    return <div className="h-3" />;
  }

  return (
    <div
      className={cn(
        "log-line flex items-start gap-3 rounded px-2 py-0.5 text-xs leading-relaxed",
        level === "ERROR" && "bg-red-500/10 dark:bg-red-900/20",
        level === "WARN" && "bg-amber-500/10 dark:bg-amber-900/20",
        !wrap && "whitespace-nowrap overflow-x-auto"
      )}
    >
      <span className="select-none text-muted-foreground/50 min-w-[3rem] text-right shrink-0 font-mono">
        {lineNumber}
      </span>
      {level && (
        <span
          className={cn(
            "shrink-0 rounded px-1 py-0 text-[10px] font-bold uppercase leading-relaxed",
            level === "ERROR" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
            level === "WARN" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
            level === "INFO" && "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          )}
        >
          {level}
        </span>
      )}
      <span
        className={cn("flex-1 text-foreground/90", wrap && "whitespace-pre-wrap break-all")}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
