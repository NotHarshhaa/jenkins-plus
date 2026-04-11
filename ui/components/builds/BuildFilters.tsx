"use client";

import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const STATUS_OPTIONS = ["SUCCESS", "FAILURE", "UNSTABLE", "ABORTED", "RUNNING"];

interface BuildFiltersProps {
  jobFilter: string;
  statusFilter: string[];
  onJobFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string[]) => void;
}

export function BuildFilters({
  jobFilter,
  statusFilter,
  onJobFilterChange,
  onStatusFilterChange,
}: BuildFiltersProps) {
  function toggleStatus(status: string) {
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter((s) => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  }

  const activeFilters = (jobFilter ? 1 : 0) + statusFilter.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {activeFilters}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">
              Job Name
            </Label>
            <Input
              placeholder="Filter by job..."
              value={jobFilter}
              onChange={(e) => onJobFilterChange(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-foreground text-xs font-semibold uppercase tracking-wider">
              Status
            </Label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatus(status)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                    statusFilter.includes(status)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => {
                  onJobFilterChange("");
                  onStatusFilterChange([]);
                }}
              >
                Clear all filters
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
