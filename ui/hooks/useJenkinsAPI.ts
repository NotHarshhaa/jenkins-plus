"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import type { JenkinsCrumb } from "@/types/jenkins";

interface UseJenkinsAPIReturn {
  get: <T>(path: string) => Promise<T>;
  post: <T>(path: string, body?: BodyInit, headers?: Record<string, string>) => Promise<T>;
}

export function useJenkinsAPI(): UseJenkinsAPIReturn {
  const crumbRef = useRef<JenkinsCrumb | null>(null);
  const crumbExpiryRef = useRef<number>(0);

  const fetchCrumb = useCallback(async (): Promise<JenkinsCrumb> => {
    if (crumbRef.current && Date.now() < crumbExpiryRef.current) {
      return crumbRef.current;
    }
    const res = await fetch("/jenkins/crumbIssuer/api/json", {
      credentials: "include",
    });
    if (!res.ok) {
      toast.error("Failed to authenticate with Jenkins");
      throw new Error(`Crumb fetch failed: ${res.status}`);
    }
    const data = (await res.json()) as JenkinsCrumb;
    crumbRef.current = data;
    crumbExpiryRef.current = Date.now() + 30 * 60 * 1000;
    return data;
  }, []);

  const get = useCallback(async <T>(path: string): Promise<T> => {
    const url = `/jenkins/${path.replace(/^\//, "")}`;
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 401 || res.status === 403) {
      toast.error("Jenkins authentication required. Check your credentials.");
      throw new Error(`Unauthorized: ${res.status}`);
    }
    if (!res.ok) {
      toast.error(`API error: ${res.status} ${res.statusText}`);
      throw new Error(`GET ${url} failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }, []);

  const post = useCallback(
    async <T>(
      path: string,
      body?: BodyInit,
      extraHeaders?: Record<string, string>
    ): Promise<T> => {
      const crumb = await fetchCrumb();
      const url = `/jenkins/${path.replace(/^\//, "")}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          [crumb.crumbRequestField]: crumb.crumb,
          ...extraHeaders,
        },
        body,
      });
      if (res.status === 401 || res.status === 403) {
        toast.error("Jenkins authentication required. Check your credentials.");
        throw new Error(`Unauthorized: ${res.status}`);
      }
      if (!res.ok) {
        toast.error(`Action failed: ${res.status} ${res.statusText}`);
        throw new Error(`POST ${url} failed: ${res.status}`);
      }
      const text = await res.text();
      return (text ? JSON.parse(text) : {}) as T;
    },
    [fetchCrumb]
  );

  return { get, post };
}
