"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration, formatAgo, getBadgeVariant, buildStatusLabel } from "@/lib/utils";
import type { Job } from "@/types/jenkins";

interface BuildsTableProps {
  jobs: Job[];
  isLoading: boolean;
  jobFilter: string;
  statusFilter: string[];
}

export function BuildsTable({ jobs, isLoading, jobFilter, statusFilter }: BuildsTableProps) {
  const router = useRouter();

  const allBuilds = jobs
    .filter((j) =>
      !jobFilter || j.name.toLowerCase().includes(jobFilter.toLowerCase())
    )
    .flatMap((j) =>
      (j.builds ?? []).slice(0, 20).map((b) => ({ job: j, build: b }))
    )
    .filter(({ build }) =>
      statusFilter.length === 0 ||
      statusFilter.includes(build.building ? "RUNNING" : (build.result ?? ""))
    )
    .sort((a, b) => b.build.timestamp - a.build.timestamp);

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card">
        <CardContent className="p-0">
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-none" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-card">
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Build #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Triggered By</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBuilds.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No builds match the current filters
                  </TableCell>
                </TableRow>
              ) : (
                allBuilds.map(({ job, build }) => {
                  const cause = build.actions
                    ?.find((a) => a.causes && a.causes.length > 0)
                    ?.causes?.[0];
                  return (
                    <TableRow
                      key={`${job.name}-${build.number}`}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(
                          `/builds/${encodeURIComponent(job.name)}/${build.number}`
                        )
                      }
                    >
                      <TableCell className="font-medium text-foreground max-w-[180px] truncate">
                        {job.displayName ?? job.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        #{build.number}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getBadgeVariant(
                            build.building ? "building" : build.result
                          )}
                        >
                          {buildStatusLabel(build.result, build.building)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[120px] truncate">
                        {build.displayName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDuration(build.duration)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[120px] truncate">
                        {cause?.userName ?? cause?.shortDescription ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatAgo(build.timestamp)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
