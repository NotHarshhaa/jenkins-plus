import type {
  JenkinsInstance,
  Job,
  Build,
  Plugin,
  JenkinsCrumb,
  StageFlowNode,
} from "@/types/jenkins";

const BASE = process.env.NEXT_PUBLIC_JENKINS_URL ?? "http://localhost:8080";
const PROXY = "/jenkins";

export function jenkinsUrl(path: string): string {
  return `${PROXY}/${path.replace(/^\//, "")}`;
}

let cachedCrumb: JenkinsCrumb | null = null;
let crumbExpiry = 0;

export async function getCrumb(): Promise<JenkinsCrumb> {
  if (cachedCrumb && Date.now() < crumbExpiry) return cachedCrumb;
  const res = await fetch(jenkinsUrl("crumbIssuer/api/json"), {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Crumb fetch failed: ${res.status}`);
  const data = (await res.json()) as JenkinsCrumb;
  cachedCrumb = data;
  crumbExpiry = Date.now() + 30 * 60 * 1000;
  return data;
}

async function mutate<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const crumb = await getCrumb();
  const res = await fetch(jenkinsUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      ...options.headers,
      [crumb.crumbRequestField]: crumb.crumb,
    },
  });
  if (!res.ok) throw new Error(`Jenkins API error: ${res.status} ${res.statusText}`);
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export async function getJobs(): Promise<Job[]> {
  const res = await fetch(
    jenkinsUrl(
      "api/json?tree=jobs[name,url,color,displayName,description,buildable,healthReport[score,description],lastBuild[number,result,building,timestamp,duration],lastSuccessfulBuild[number],lastFailedBuild[number]]"
    ),
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`getJobs failed: ${res.status}`);
  const data = (await res.json()) as JenkinsInstance;
  return data.jobs ?? [];
}

export async function getJob(jobName: string): Promise<Job> {
  const encoded = encodeURIComponent(jobName);
  const res = await fetch(
    jenkinsUrl(
      `job/${encoded}/api/json?tree=name,url,color,displayName,description,buildable,builds[number,url,result,building,timestamp,duration,displayName,fullDisplayName,description,builtOn,actions[causes[shortDescription,userId,userName]]]{0,50}`
    ),
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`getJob failed: ${res.status}`);
  return (await res.json()) as Job;
}

export async function getBuild(jobName: string, buildNumber: number): Promise<Build> {
  const encoded = encodeURIComponent(jobName);
  const res = await fetch(
    jenkinsUrl(
      `job/${encoded}/${buildNumber}/api/json?tree=id,number,url,result,building,timestamp,duration,estimatedDuration,displayName,fullDisplayName,description,builtOn,changeSets[items[commitId,author[fullName],authorEmail,comment,msg,date]],actions[causes[shortDescription,userId,userName],parameters[name,value]]`
    ),
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`getBuild failed: ${res.status}`);
  return (await res.json()) as Build;
}

export async function triggerBuild(
  jobName: string,
  params?: Record<string, string>
): Promise<void> {
  const encoded = encodeURIComponent(jobName);
  if (params && Object.keys(params).length > 0) {
    const form = new URLSearchParams(params);
    await mutate<void>(`job/${encoded}/buildWithParameters`, {
      method: "POST",
      body: form,
    });
  } else {
    await mutate<void>(`job/${encoded}/build`, { method: "POST" });
  }
}

export async function getBuildLog(
  jobName: string,
  buildNumber: number,
  start = 0
): Promise<{ text: string; size: number; more: boolean }> {
  const encoded = encodeURIComponent(jobName);
  const res = await fetch(
    jenkinsUrl(
      `job/${encoded}/${buildNumber}/logText/progressiveText?start=${start}`
    ),
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`getBuildLog failed: ${res.status}`);
  const text = await res.text();
  const size = parseInt(res.headers.get("X-Text-Size") ?? "0", 10);
  const more = res.headers.get("X-More-Data") === "true";
  return { text, size, more };
}

export async function getStageFlow(
  jobName: string,
  buildNumber: number
): Promise<StageFlowNode[]> {
  const encoded = encodeURIComponent(jobName);
  const res = await fetch(
    jenkinsUrl(`job/${encoded}/${buildNumber}/wfapi/describe`),
    { credentials: "include" }
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { stages: StageFlowNode[] };
  return data.stages ?? [];
}

export async function getPlugins(): Promise<Plugin[]> {
  const res = await fetch(
    jenkinsUrl(
      "pluginManager/api/json?tree=plugins[shortName,longName,version,description,active,enabled,hasUpdate,url,stats[installations]]"
    ),
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`getPlugins failed: ${res.status}`);
  const data = (await res.json()) as {
    plugins: Array<{
      shortName: string;
      longName: string;
      version: string;
      description: string;
      active: boolean;
      enabled: boolean;
      url: string;
      stats?: { installations?: Array<{ total: number }> };
    }>;
  };
  return data.plugins.map((p) => ({
    name: p.longName,
    shortName: p.shortName,
    version: p.version,
    description: p.description,
    category: "Other" as const,
    installCount: p.stats?.installations?.[0]?.total ?? 0,
    compatibilityStatus: "compatible" as const,
    installed: p.active,
    url: p.url ?? "",
  }));
}

export async function installPlugin(pluginShortName: string): Promise<void> {
  const xml = `<jenkins><install plugin="${pluginShortName}@latest"/></jenkins>`;
  await mutate<void>("pluginManager/installNecessaryPlugins", {
    method: "POST",
    headers: { "Content-Type": "text/xml" },
    body: xml,
  });
}

export async function getJenkinsInfo(): Promise<Pick<JenkinsInstance, "version" | "mode" | "nodeDescription" | "numExecutors" | "quietingDown" | "useSecurity">> {
  const res = await fetch(
    jenkinsUrl("api/json?tree=version,mode,nodeDescription,numExecutors,quietingDown,useSecurity"),
    { credentials: "include" }
  );
  if (!res.ok) throw new Error(`getJenkinsInfo failed: ${res.status}`);
  return res.json() as Promise<Pick<JenkinsInstance, "version" | "mode" | "nodeDescription" | "numExecutors" | "quietingDown" | "useSecurity">>;
}

export { BASE };
