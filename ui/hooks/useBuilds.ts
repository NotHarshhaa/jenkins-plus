"use client";

import useSWR from "swr";
import type { Job } from "@/types/jenkins";

const TREE =
  "jobs[name,url,color,displayName,description,buildable,healthReport[score,description],lastBuild[number,result,building,timestamp,duration,displayName,fullDisplayName,builtOn,actions[causes[shortDescription,userId,userName]]],lastSuccessfulBuild[number],lastFailedBuild[number]]";

async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`/jenkins/api/json?tree=${encodeURIComponent(TREE)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.status}`);
  const data = (await res.json()) as { jobs: Job[] };
  return data.jobs ?? [];
}

export function useBuilds() {
  const { data, error, isLoading, mutate } = useSWR<Job[], Error>(
    "/api/builds",
    fetchJobs,
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    jobs: data ?? [],
    isLoading,
    error,
    refresh: mutate,
  };
}
