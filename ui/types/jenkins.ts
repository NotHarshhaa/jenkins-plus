export type BuildResult = "SUCCESS" | "FAILURE" | "UNSTABLE" | "ABORTED" | "NOT_BUILT" | null;

export interface JenkinsCrumb {
  crumb: string;
  crumbRequestField: string;
}

export interface Build {
  id: string;
  number: number;
  url: string;
  result: BuildResult;
  building: boolean;
  timestamp: number;
  duration: number;
  estimatedDuration: number;
  displayName: string;
  fullDisplayName: string;
  description: string | null;
  builtOn: string;
  changeSets: ChangeSet[];
  causes: Cause[];
  actions: BuildAction[];
}

export interface ChangeSet {
  kind: string;
  items: ChangeSetItem[];
}

export interface ChangeSetItem {
  commitId: string;
  author: { fullName: string; absoluteUrl: string };
  authorEmail: string;
  comment: string;
  date: string;
  id: string;
  msg: string;
  paths: { editType: string; file: string }[];
}

export interface Cause {
  _class: string;
  shortDescription: string;
  userId?: string;
  userName?: string;
}

export interface BuildAction {
  _class: string;
  parameters?: Parameter[];
  causes?: Cause[];
}

export interface Parameter {
  name: string;
  value: string | number | boolean;
}

export interface Job {
  name: string;
  url: string;
  color: string;
  displayName: string;
  description: string | null;
  buildable: boolean;
  builds: Build[];
  lastBuild: Build | null;
  lastSuccessfulBuild: Build | null;
  lastFailedBuild: Build | null;
  lastStableBuild: Build | null;
  healthReport: HealthReport[];
}

export interface HealthReport {
  description: string;
  iconClassName: string;
  iconUrl: string;
  score: number;
}

export interface Stage {
  id: string;
  name: string;
  agent: AgentType;
  dockerImage?: string;
  envVars: EnvVar[];
  steps: Step[];
  post: PostActions;
}

export type AgentType = "any" | "docker" | "kubernetes" | "shell" | "none";

export interface EnvVar {
  id: string;
  key: string;
  value: string;
}

export enum StepType {
  Shell = "shell",
  DockerBuild = "dockerBuild",
  HelmDeploy = "helmDeploy",
  SonarScan = "sonarScan",
  SlackNotify = "slackNotify",
}

export interface BaseStep {
  id: string;
  type: StepType;
}

export interface ShellStep extends BaseStep {
  type: StepType.Shell;
  script: string;
}

export interface DockerBuildStep extends BaseStep {
  type: StepType.DockerBuild;
  image: string;
  tag: string;
  dockerfile: string;
}

export interface HelmDeployStep extends BaseStep {
  type: StepType.HelmDeploy;
  chart: string;
  release: string;
  namespace: string;
}

export interface SonarScanStep extends BaseStep {
  type: StepType.SonarScan;
  projectKey: string;
  sonarUrl: string;
}

export interface SlackNotifyStep extends BaseStep {
  type: StepType.SlackNotify;
  channel: string;
  status: "good" | "warning" | "danger";
}

export type Step =
  | ShellStep
  | DockerBuildStep
  | HelmDeployStep
  | SonarScanStep
  | SlackNotifyStep;

export interface PostActions {
  always: string;
  success: string;
  failure: string;
}

export interface PipelineConfig {
  name: string;
  agent: AgentType;
  dockerImage?: string;
  stages: Stage[];
  envVars: EnvVar[];
}

export interface DORAMetrics {
  deployFrequency: number;
  deployFrequencyUnit: "day" | "week" | "month";
  leadTimeHours: number;
  changeFailureRate: number;
  mttrHours: number;
  band: DORABand;
}

export type DORABand = "elite" | "high" | "medium" | "low";

export interface DORADataPoint {
  date: string;
  value: number;
}

export interface Plugin {
  name: string;
  shortName: string;
  version: string;
  description: string;
  category: PluginCategory;
  installCount: number;
  compatibilityStatus: PluginCompatibility;
  installed: boolean;
  url: string;
}

export type PluginCategory =
  | "SCM"
  | "Pipeline"
  | "Security"
  | "Notification"
  | "Quality"
  | "Other";

export type PluginCompatibility = "compatible" | "deprecated" | "unknown";

export interface JenkinsInstance {
  url: string;
  version: string;
  mode: string;
  nodeDescription: string;
  numExecutors: number;
  quietingDown: boolean;
  useSecurity: boolean;
  jobs: Job[];
}

export interface AgentNode {
  displayName: string;
  description: string;
  online: boolean;
  idle: boolean;
  numExecutors: number;
}

export interface LogLine {
  lineNumber: number;
  text: string;
  timestamp?: string;
  level?: LogLevel;
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "ALL";

export interface StageFlowNode {
  id: string;
  name: string;
  status: "SUCCESS" | "FAILURE" | "IN_PROGRESS" | "PAUSED" | "NOT_EXECUTED" | "ABORTED";
  startTimeMillis: number;
  durationMillis: number;
  type: "STAGE" | "PARALLEL";
  children?: StageFlowNode[];
}
