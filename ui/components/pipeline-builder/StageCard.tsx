"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stage } from "@/types/jenkins";

interface StageCardProps {
  stage: Stage;
  isActive?: boolean;
  onDelete: (id: string) => void;
  onEdit: (stage: Stage) => void;
}

export function StageCard({ stage, isActive, onDelete, onEdit }: StageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative min-w-[180px] max-w-[220px]",
        isDragging && "opacity-50"
      )}
    >
      <Card
        className={cn(
          "bg-card dark:bg-card cursor-pointer border-2 transition-colors",
          isActive
            ? "border-primary"
            : "border-border hover:border-primary/50"
        )}
        onClick={() => onEdit(stage)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              {...attributes}
              {...listeners}
              className="mt-0.5 cursor-grab touch-none text-muted-foreground hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {stage.name || "Untitled Stage"}
              </p>
              <div className="mt-1 flex items-center gap-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {stage.agent}
                </Badge>
                {stage.steps.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {stage.steps.length} step{stage.steps.length !== 1 ? "s" : ""}
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(stage.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
