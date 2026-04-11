import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { BuildResult, DORABand } from "@/types/jenkins";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function formatAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function statusColor(result: BuildResult | string | null): string {
  switch (result) {
    case "SUCCESS":
      return "text-green-500 dark:text-green-400";
    case "FAILURE":
      return "text-red-500 dark:text-red-400";
    case "UNSTABLE":
      return "text-yellow-500 dark:text-yellow-400";
    case "ABORTED":
      return "text-slate-400 dark:text-slate-500";
    case "IN_PROGRESS":
    case "building":
      return "text-blue-500 dark:text-blue-400";
    default:
      return "text-slate-400 dark:text-slate-500";
  }
}

export type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning";

export function getBadgeVariant(status: BuildResult | string | null): BadgeVariant {
  switch (status) {
    case "SUCCESS":
      return "success";
    case "FAILURE":
      return "destructive";
    case "UNSTABLE":
      return "warning";
    case "ABORTED":
      return "secondary";
    default:
      return "outline";
  }
}

export function getDORABandColor(band: DORABand): string {
  switch (band) {
    case "elite":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "high":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "medium":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
    case "low":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function buildStatusLabel(result: BuildResult, building: boolean): string {
  if (building) return "Running";
  switch (result) {
    case "SUCCESS":
      return "Success";
    case "FAILURE":
      return "Failed";
    case "UNSTABLE":
      return "Unstable";
    case "ABORTED":
      return "Aborted";
    case "NOT_BUILT":
      return "Not Built";
    default:
      return "Unknown";
  }
}
