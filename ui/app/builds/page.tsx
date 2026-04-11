"use client";

import { BuildsTable } from "@/components/builds/BuildsTable";
import { BuildFilters } from "@/components/builds/BuildFilters";
import { useBuilds } from "@/hooks/useBuilds";
import { useState } from "react";

export default function BuildsPage() {
  const { jobs, isLoading } = useBuilds();
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [jobFilter, setJobFilter] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Builds</h1>
          <p className="text-sm text-muted-foreground">All builds across all jobs</p>
        </div>
        <BuildFilters
          jobFilter={jobFilter}
          statusFilter={statusFilter}
          onJobFilterChange={setJobFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>
      <BuildsTable
        jobs={jobs}
        isLoading={isLoading}
        jobFilter={jobFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
}
