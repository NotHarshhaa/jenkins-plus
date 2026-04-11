import type {
  PipelineConfig,
  Stage,
  Step,
  EnvVar,
  PostActions,
} from "@/types/jenkins";
import { StepType } from "@/types/jenkins";

function indent(level: number): string {
  return "    ".repeat(level);
}

function renderEnvBlock(envVars: EnvVar[], level: number): string {
  if (envVars.length === 0) return "";
  const lines: string[] = [];
  lines.push(`${indent(level)}environment {`);
  for (const e of envVars) {
    if (e.key.trim()) {
      lines.push(`${indent(level + 1)}${e.key} = '${e.value}'`);
    }
  }
  lines.push(`${indent(level)}}`);
  return lines.join("\n");
}

function renderAgentBlock(
  agent: Stage["agent"],
  dockerImage?: string,
  level = 1
): string {
  switch (agent) {
    case "any":
      return `${indent(level)}agent any`;
    case "none":
      return `${indent(level)}agent none`;
    case "docker":
      return [
        `${indent(level)}agent {`,
        `${indent(level + 1)}docker {`,
        `${indent(level + 2)}image '${dockerImage ?? "alpine:latest"}'`,
        `${indent(level + 1)}}`,
        `${indent(level)}}`,
      ].join("\n");
    case "kubernetes":
      return [
        `${indent(level)}agent {`,
        `${indent(level + 1)}kubernetes {`,
        `${indent(level + 2)}yaml """`,
        `${indent(level + 2)}apiVersion: v1`,
        `${indent(level + 2)}kind: Pod`,
        `${indent(level + 2)}spec:`,
        `${indent(level + 2)}  containers:`,
        `${indent(level + 2)}  - name: main`,
        `${indent(level + 2)}    image: ${dockerImage ?? "alpine:latest"}`,
        `${indent(level + 2)}    command: ['sleep', '9999999']`,
        `${indent(level + 2)}"""`,
        `${indent(level + 1)}}`,
        `${indent(level)}}`,
      ].join("\n");
    case "shell":
      return `${indent(level)}agent any`;
    default:
      return `${indent(level)}agent any`;
  }
}

function renderStep(step: Step, level: number): string {
  switch (step.type) {
    case StepType.Shell:
      if (step.script.includes("\n")) {
        return [
          `${indent(level)}sh '''`,
          ...step.script.split("\n").map((l) => `${indent(level + 1)}${l}`),
          `${indent(level)}'''`,
        ].join("\n");
      }
      return `${indent(level)}sh '${step.script.replace(/'/g, "\\'")}'`;

    case StepType.DockerBuild:
      return [
        `${indent(level)}sh """`,
        `${indent(level + 1)}docker build \\`,
        `${indent(level + 2)}-f ${step.dockerfile || "Dockerfile"} \\`,
        `${indent(level + 2)}-t ${step.image}:${step.tag} \\`,
        `${indent(level + 2)}.`,
        `${indent(level + 1)}docker push ${step.image}:${step.tag}`,
        `${indent(level)}"""`,
      ].join("\n");

    case StepType.HelmDeploy:
      return [
        `${indent(level)}sh """`,
        `${indent(level + 1)}helm upgrade --install ${step.release} ${step.chart} \\`,
        `${indent(level + 2)}--namespace ${step.namespace} \\`,
        `${indent(level + 2)}--create-namespace \\`,
        `${indent(level + 2)}--wait`,
        `${indent(level)}"""`,
      ].join("\n");

    case StepType.SonarScan:
      return [
        `${indent(level)}withSonarQubeEnv('sonarqube') {`,
        `${indent(level + 1)}sh """`,
        `${indent(level + 2)}sonar-scanner \\`,
        `${indent(level + 3)}-Dsonar.projectKey=${step.projectKey} \\`,
        `${indent(level + 3)}-Dsonar.host.url=${step.sonarUrl}`,
        `${indent(level + 1)}"""`,
        `${indent(level)}}`,
      ].join("\n");

    case StepType.SlackNotify:
      return `${indent(level)}slackSend(channel: '${step.channel}', color: '${step.status}', message: "Build \${currentBuild.fullDisplayName}: \${currentBuild.result}")`;
  }
}

function renderPostActions(post: PostActions, level: number): string {
  const hasAny = post.always.trim();
  const hasSuccess = post.success.trim();
  const hasFailure = post.failure.trim();
  if (!hasAny && !hasSuccess && !hasFailure) return "";

  const lines: string[] = [`${indent(level)}post {`];
  if (hasAny) {
    lines.push(`${indent(level + 1)}always {`);
    lines.push(`${indent(level + 2)}sh '${post.always.replace(/'/g, "\\'")}'`);
    lines.push(`${indent(level + 1)}}`);
  }
  if (hasSuccess) {
    lines.push(`${indent(level + 1)}success {`);
    lines.push(
      `${indent(level + 2)}sh '${post.success.replace(/'/g, "\\'")}'`
    );
    lines.push(`${indent(level + 1)}}`);
  }
  if (hasFailure) {
    lines.push(`${indent(level + 1)}failure {`);
    lines.push(
      `${indent(level + 2)}sh '${post.failure.replace(/'/g, "\\'")}'`
    );
    lines.push(`${indent(level + 1)}}`);
  }
  lines.push(`${indent(level)}}`);
  return lines.join("\n");
}

function renderStage(stage: Stage): string {
  const lines: string[] = [];
  lines.push(`${indent(2)}stage('${stage.name}') {`);

  if (stage.agent !== "any") {
    lines.push(renderAgentBlock(stage.agent, stage.dockerImage, 3));
  }

  const envBlock = renderEnvBlock(stage.envVars, 3);
  if (envBlock) lines.push(envBlock);

  lines.push(`${indent(3)}steps {`);
  for (const step of stage.steps) {
    lines.push(renderStep(step, 4));
  }
  lines.push(`${indent(3)}}`);

  const postBlock = renderPostActions(stage.post, 3);
  if (postBlock) lines.push(postBlock);

  lines.push(`${indent(2)}}`);
  return lines.join("\n");
}

export function generateJenkinsfile(config: PipelineConfig): string {
  const lines: string[] = ["pipeline {"];

  lines.push(renderAgentBlock(config.agent, config.dockerImage, 1));

  const topEnv = renderEnvBlock(config.envVars, 1);
  if (topEnv) lines.push(topEnv);

  lines.push(`${indent(1)}stages {`);
  for (const stage of config.stages) {
    lines.push(renderStage(stage));
  }
  lines.push(`${indent(1)}}`);

  lines.push("}");
  return lines.join("\n");
}
