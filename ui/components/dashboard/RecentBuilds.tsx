"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration, formatAgo, getBadgeVariant, buildStatusLabel } from "@/lib/utils";
import type { Job } from "@/types/jenkins";

interface RecentBuildsProps {
  jobs: Job[];
  isLoading: boolean;
}

export function RecentBuilds({ jobs, isLoading }: RecentBuildsProps) {
  const router = useRouter();

  const recentBuilds = jobs
    .filter((j) => j.lastBuild)
    .map((j) => ({ job: j, build: j.lastBuild! }))
    .sort((a, b) => b.build.timestamp - a.build.timestamp)
    .slice(0, 10);

  if (isLoading) {
    return (
      <Card className="bg-card dark:bg-card">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card dark:bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Builds</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Build</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBuilds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No builds found
                  </TableCell>
                </TableRow>
              ) : (
                recentBuilds.map(({ job, build }) => (
                  <TableRow
                    key={`${job.name}-${build.number}`}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/builds/${encodeURIComponent(job.name)}/${build.number}`
                      )
                    }
                  >
                    <TableCell className="font-medium text-foreground max-w-[160px] truncate">
                      {job.displayName ?? job.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      #{build.number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(build.building ? "building" : build.result)}>
                        {buildStatusLabel(build.result, build.building)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDuration(build.duration)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatAgo(build.timestamp)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
