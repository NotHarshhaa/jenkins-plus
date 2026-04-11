import { generateJenkinsfile } from "../generateJenkinsfile";
import type { PipelineConfig } from "@/types/jenkins";
import { StepType } from "@/types/jenkins";

const baseConfig: PipelineConfig = {
  name: "my-pipeline",
  agent: "any",
  stages: [],
  envVars: [],
};

describe("generateJenkinsfile", () => {
  it("generates minimal pipeline with agent any", () => {
    const result = generateJenkinsfile(baseConfig);
    expect(result).toContain("pipeline {");
    expect(result).toContain("agent any");
    expect(result).toContain("stages {");
    expect(result).toContain("}");
  });

  it("generates top-level environment block", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      envVars: [{ id: "1", key: "NODE_ENV", value: "production" }],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("environment {");
    expect(result).toContain("NODE_ENV = 'production'");
  });

  it("generates docker agent with image", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      agent: "docker",
      dockerImage: "node:18-alpine",
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("docker {");
    expect(result).toContain("image 'node:18-alpine'");
  });

  it("generates kubernetes agent block", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      agent: "kubernetes",
      dockerImage: "maven:3.9",
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("kubernetes {");
    expect(result).toContain("image: maven:3.9");
  });

  it("generates a stage with shell step", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Build",
          agent: "any",
          envVars: [],
          steps: [
            { id: "step1", type: StepType.Shell, script: "npm ci" },
          ],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("stage('Build')");
    expect(result).toContain("steps {");
    expect(result).toContain("sh 'npm ci'");
  });

  it("generates multiline shell step with triple quotes", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Test",
          agent: "any",
          envVars: [],
          steps: [
            {
              id: "step1",
              type: StepType.Shell,
              script: "npm install\nnpm test",
            },
          ],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("sh '''");
    expect(result).toContain("npm install");
    expect(result).toContain("npm test");
  });

  it("generates docker build step", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Docker",
          agent: "any",
          envVars: [],
          steps: [
            {
              id: "step1",
              type: StepType.DockerBuild,
              image: "myapp",
              tag: "latest",
              dockerfile: "Dockerfile",
            },
          ],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("docker build");
    expect(result).toContain("-t myapp:latest");
    expect(result).toContain("docker push myapp:latest");
  });

  it("generates helm deploy step", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Deploy",
          agent: "any",
          envVars: [],
          steps: [
            {
              id: "step1",
              type: StepType.HelmDeploy,
              chart: "./charts/myapp",
              release: "myapp-prod",
              namespace: "production",
            },
          ],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("helm upgrade --install myapp-prod ./charts/myapp");
    expect(result).toContain("--namespace production");
  });

  it("generates sonar scan step", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Sonar",
          agent: "any",
          envVars: [],
          steps: [
            {
              id: "step1",
              type: StepType.SonarScan,
              projectKey: "my-project",
              sonarUrl: "http://sonar:9000",
            },
          ],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("withSonarQubeEnv");
    expect(result).toContain("-Dsonar.projectKey=my-project");
    expect(result).toContain("-Dsonar.host.url=http://sonar:9000");
  });

  it("generates slack notify step", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Notify",
          agent: "any",
          envVars: [],
          steps: [
            {
              id: "step1",
              type: StepType.SlackNotify,
              channel: "#deployments",
              status: "good",
            },
          ],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("slackSend");
    expect(result).toContain("channel: '#deployments'");
    expect(result).toContain("color: 'good'");
  });

  it("generates post actions block", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Build",
          agent: "any",
          envVars: [],
          steps: [],
          post: {
            always: "echo done",
            success: "echo success",
            failure: "echo failed",
          },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("post {");
    expect(result).toContain("always {");
    expect(result).toContain("success {");
    expect(result).toContain("failure {");
    expect(result).toContain("echo done");
    expect(result).toContain("echo success");
    expect(result).toContain("echo failed");
  });

  it("generates stage-level env vars", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Build",
          agent: "any",
          envVars: [{ id: "e1", key: "BUILD_ENV", value: "staging" }],
          steps: [],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).toContain("BUILD_ENV = 'staging'");
  });

  it("generates multiple stages in order", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Checkout",
          agent: "any",
          envVars: [],
          steps: [{ id: "st1", type: StepType.Shell, script: "git checkout ." }],
          post: { always: "", success: "", failure: "" },
        },
        {
          id: "s2",
          name: "Build",
          agent: "any",
          envVars: [],
          steps: [{ id: "st2", type: StepType.Shell, script: "mvn package" }],
          post: { always: "", success: "", failure: "" },
        },
        {
          id: "s3",
          name: "Deploy",
          agent: "any",
          envVars: [],
          steps: [{ id: "st3", type: StepType.Shell, script: "kubectl apply -f k8s/" }],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    const checkoutPos = result.indexOf("stage('Checkout')");
    const buildPos = result.indexOf("stage('Build')");
    const deployPos = result.indexOf("stage('Deploy')");
    expect(checkoutPos).toBeLessThan(buildPos);
    expect(buildPos).toBeLessThan(deployPos);
  });

  it("omits post block when all post fields are empty", () => {
    const config: PipelineConfig = {
      ...baseConfig,
      stages: [
        {
          id: "s1",
          name: "Test",
          agent: "any",
          envVars: [],
          steps: [{ id: "st1", type: StepType.Shell, script: "npm test" }],
          post: { always: "", success: "", failure: "" },
        },
      ],
    };
    const result = generateJenkinsfile(config);
    expect(result).not.toContain("post {");
  });
});
