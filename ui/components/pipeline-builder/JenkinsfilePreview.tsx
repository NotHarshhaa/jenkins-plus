"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import hljs from "highlight.js/lib/core";
import groovy from "highlight.js/lib/languages/groovy";
import "highlight.js/styles/github-dark.css";
import type { PipelineConfig } from "@/types/jenkins";
import { generateJenkinsfile } from "@/lib/generateJenkinsfile";

hljs.registerLanguage("groovy", groovy);

interface JenkinsfilePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: PipelineConfig;
}

export function JenkinsfilePreview({ open, onOpenChange, config }: JenkinsfilePreviewProps) {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const jenkinsfile = generateJenkinsfile(config);

  useEffect(() => {
    if (open && codeRef.current) {
      codeRef.current.innerHTML = jenkinsfile;
      hljs.highlightElement(codeRef.current);
    }
  }, [open, jenkinsfile]);

  async function handleCopy() {
    await navigator.clipboard.writeText(jenkinsfile);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([jenkinsfile], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Jenkinsfile";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground">Jenkinsfile Preview</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-4">
          <pre className="text-sm">
            <code ref={codeRef} className="language-groovy" />
          </pre>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
