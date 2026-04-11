"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseBuildLogReturn {
  log: string;
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
  refresh: () => void;
}

export function useBuildLog(
  jobName: string,
  buildNumber: number,
  isBuilding: boolean
): UseBuildLogReturn {
  const [log, setLog] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(!isBuilding);
  const [error, setError] = useState<string | null>(null);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const encoded = encodeURIComponent(jobName);
      const res = await fetch(
        `/jenkins/job/${encoded}/${buildNumber}/logText/progressiveText?start=${startRef.current}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        setError(`Failed to fetch log: ${res.status}`);
        return;
      }
      const text = await res.text();
      const size = parseInt(res.headers.get("X-Text-Size") ?? "0", 10);
      const more = res.headers.get("X-More-Data") === "true";

      if (text) {
        setLog((prev: string) => prev + text);
        startRef.current = size;
      }
      setIsLoading(false);

      if (more && mountedRef.current) {
        timerRef.current = setTimeout(poll, 1500);
      } else {
        setIsComplete(true);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setIsLoading(false);
      }
    }
  }, [jobName, buildNumber]);

  const refresh = useCallback(() => {
    setLog("");
    setIsLoading(true);
    setIsComplete(false);
    setError(null);
    startRef.current = 0;
    if (timerRef.current) clearTimeout(timerRef.current);
    void poll();
  }, [poll]);

  useEffect(() => {
    mountedRef.current = true;
    void poll();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [poll]);

  return { log, isLoading, isComplete, error, refresh };
}
