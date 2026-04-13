<div align="center">

<img src="https://img.shields.io/badge/Jenkins-Plus-D24939?style=for-the-badge&logo=jenkins&logoColor=white" alt="Jenkins Plus"/>

![Jenkins Plus Logo](https://camo.githubusercontent.com/4be717d5f921f8cba54b8f9959e3dcf67fb43acc443c02b7be58ea87e0dfbb8b/68747470733a2f2f7777772e6a656e6b696e732e696f2f696d616765732f6a656e6b696e732d6c6f676f2d7469746c652d6461726b2e737667)

**A batteries-included Jenkins distribution — modern UI, 40+ pre-configured plugins, and one-command deployment.**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
[![Jenkins LTS](https://img.shields.io/badge/Jenkins-LTS%202.504-D24939?style=flat-square&logo=jenkins&logoColor=white)](https://www.jenkins.io/changelog-stable/)
[![Docker Pulls](https://img.shields.io/docker/pulls/notharshaa/jenkins-plus?style=flat-square&logo=docker)](https://hub.docker.com/r/notharshaa/jenkins-plus)
[![Helm Chart](https://img.shields.io/badge/Helm-v3-0F1689?style=flat-square&logo=helm)](helm/)
[![GitHub Stars](https://img.shields.io/github/stars/NotHarshhaa/jenkins-plus?style=flat-square&logo=github)](https://github.com/NotHarshhaa/jenkins-plus/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

<br/>

> Vanilla Jenkins takes hours of plugin hunting, CSRF debugging, and YAML wrangling before your first pipeline runs.  
> **jenkins-plus ships everything pre-wired.** One command. Real pipelines. Zero click-ops.

<br/>

[**Quick Start**](#-quick-start) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**Deploy**](#-deployment) · [**Docs**](docs/) · [**Contributing**](#-contributing)

</div>

---

## 📸 Screenshots

| Modern Dashboard | Pipeline Builder | DORA Metrics |
|:---:|:---:|:---:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Pipeline Builder](docs/screenshots/pipeline-builder.png) | ![DORA](docs/screenshots/dora.png) |

---

## ✨ Features

### 🎛️ Modern UI Dashboard
A React + Tailwind dashboard that replaces Jenkins' dated Stapler UI — served via Nginx alongside the classic API.

- **Drag-and-drop Pipeline Builder** — visually construct stages, generate `Jenkinsfile` automatically
- **Live Log Viewer** — streaming ANSI-coloured logs with full-text search and filter
- **DORA Metrics** — deploy frequency, lead time, MTTR, change failure rate — all out of the box
- **Plugin Marketplace** — 1-click install with compatibility checks before applying

### 📦 40+ Pre-Bundled Plugins (Pinned & Tested Together)

| Category | Plugins |
|---|---|
| **SCM** | Git, GitHub Branch Source, GitLab, Bitbucket Server |
| **Pipeline** | Multibranch Pipeline, Pipeline Replay, Job DSL |
| **Agents** | Kubernetes, Docker, SSH Build Agents |
| **Security** | Matrix Authorization, OIDC/SSO, Credentials Binding, HashiCorp Vault |
| **Quality** | JUnit, Cobertura, SonarQube Scanner, OWASP Dependency Check |
| **Notifications** | Slack, Email Extension, Generic Webhook Trigger |
| **Observability** | Prometheus, OpenTelemetry, Build Monitor View |
| **Ops** | Throttle Concurrent Builds, Priority Sorter, Timestamper |

### ⚙️ JCasC Bootstrap (Zero Click-Ops)
Full `jenkins.yaml` baked into the image. Every setting is env-var overridable — no manual UI configuration ever needed.

### 📚 Built-in Shared Library
Drop-in Groovy steps importable from any `Jenkinsfile`:

```groovy
@Library('jenkins-plus') _

pipeline {
  agent any
  stages {
    stage('Build') { steps { dockerBuild(tag: "myapp:${env.BUILD_NUMBER}") } }
    stage('Scan')  { steps { sonarScan(projectKey: 'myapp') } }
    stage('Deploy') { steps { helmDeploy(chart: 'myapp', namespace: 'prod') } }
    stage('Notify') { steps { slackNotify(channel: '#deployments', status: 'success') } }
  }
}
```

### 🔐 Hardened Security Defaults
- RBAC enabled, no anonymous access
- CSRF protection enforced
- JNLP agent port disabled by default
- **Auto-detecting security realm**: Local accounts in dev (`OIDC_ISSUER` unset), OIDC SSO in production (`OIDC_ISSUER` set)
- OIDC / LDAP pre-wired (supply credentials, not config)
- Secrets via HashiCorp Vault or Kubernetes Secrets — never plaintext env vars

### 📊 Observability Out of the Box
- Prometheus metrics at `/prometheus`
- Pre-built Grafana dashboards (bundled in `docker-compose.yml`)
- OpenTelemetry traces for distributed pipeline tracing

---

## ⚡ Quick Start

### Option 1 — Docker Compose (Local, Fastest)

```bash
# Clone the repo
git clone https://github.com/NotHarshhaa/jenkins-plus
cd jenkins-plus

# Start everything (controller + 2 agents + Prometheus + Grafana)
docker compose up -d

# Wait for Jenkins to boot (~30s), then open:
open http://localhost:8080   # Jenkins classic UI + REST API
open http://localhost:3000   # Modern React dashboard
open http://localhost:9090   # Grafana (admin / admin)
```

Default credentials: `admin` / `admin` — **change immediately** via `ADMIN_PASSWORD` env var.

> **Note**: By default, Jenkins uses local accounts (dev mode). To enable OIDC SSO (production mode), set `OIDC_ISSUER`, `OIDC_CLIENT_ID`, and `OIDC_CLIENT_SECRET` in your `.env` file. The security realm auto-detects the mode at startup.

### Option 2 — `jpctl` CLI

```bash
# Install jpctl
curl -sSL https://raw.githubusercontent.com/NotHarshhaa/jenkins-plus/main/install.sh | bash

# Bootstrap a local instance
jpctl up

# Bootstrap with custom options
jpctl up \
  --admin-password mysecret \
  --github-org my-org \
  --agents 4 \
  --with-sonar \
  --with-vault
```

### Option 3 — Docker Run (Minimal)

```bash
docker run -d \
  --name jenkins-plus \
  -p 8080:8080 \
  -p 50000:50000 \
  -e ADMIN_PASSWORD=changeme \
  -e GITHUB_ORG=my-org \
  -v jenkins-data:/var/jenkins_home \
  notharshaa/jenkins-plus:latest
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
│   React Dashboard  │  Pipeline Builder  │  DORA Metrics    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    Nginx Reverse Proxy
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   API / Control Layer                       │
│   (Jenkins REST API / Optional Custom Backend Service)      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              Jenkins Core (Execution Engine)                │
│   - JCasC (Configuration as Code)                           │
│   - Plugin System (SCM, Security, Pipelines, etc.)          │
│   - Shared Library (Reusable pipeline logic)                │
│   - RBAC + OIDC (Security Layer)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Execution Layer (Agents)                  │
│   Docker Agents │ Kubernetes Agents │ SSH Agents            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                   Infrastructure Layer                      │
│   Docker Compose │ Helm │ Terraform (AWS/GCP/Azure)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```
jenkins-plus/
├── 📦 docker/                      # Docker build artifacts
│   ├── Dockerfile                  # Jenkins LTS base + plugin install
│   ├── nginx/                      # Nginx reverse proxy config
│   ├── grafana/                    # Grafana dashboards & provisioning
│   ├── prometheus/                 # Prometheus configuration
│   └── init.groovy.d/               # Init scripts for Jenkins
│
├── 🎨 ui/                          # Next.js 14 UI Layer
│   ├── app/                        # App router pages
│   │   ├── dashboard/              # Main dashboard
│   │   ├── pipeline-builder/       # Visual pipeline editor
│   │   ├── dora/                   # DORA metrics
│   │   ├── plugins/                # Plugin marketplace
│   │   └── settings/               # Configuration UI
│   ├── components/                 # React components
│   │   ├── ui/                     # shadcn/ui primitives
│   │   ├── pipeline-builder/       # Pipeline builder components
│   │   ├── log-viewer/             # Streaming log viewer
│   │   └── dora/                   # DORA metrics components
│   ├── lib/                        # Utilities & helpers
│   ├── hooks/                      # Custom React hooks
│   ├── types/                      # TypeScript types
│   └── package.json
│
├── ⚙️  jenkins-core/               # Jenkins Core (Execution Engine)
│   ├── plugin-system/              # Plugin configuration
│   │   ├── plugins.txt             # 50+ pinned plugins
│   │   └── plugin-compat-matrix.json # Plugin compatibility matrix
│   ├── jcasc/                      # JCasC (Configuration as Code)
│   │   └── jenkins.yaml            # Full JCasC configuration
│   └── shared-library/             # Reusable pipeline logic
│       ├── vars/                   # Global pipeline steps
│       │   ├── dockerBuild.groovy
│       │   ├── helmDeploy.groovy
│       │   ├── sonarScan.groovy
│       │   ├── slackNotify.groovy
│       │   └── owaspScan.groovy
│       └── src/                    # Groovy utility classes
│           └── org/jenkinsplus/
│
├── 🚀 execution-layer/            # Execution Layer (Agents)
│   ├── kubernetes-agents/          # K8s pod templates
│   │   ├── docker-agent.yaml       # Docker build agent
│   │   ├── node-agent.yaml         # Node.js build agent
│   │   ├── python-agent.yaml       # Python build agent
│   │   └── go-agent.yaml           # Go build agent
│   ├── docker-agents/              # Docker agent configuration
│   │   └── README.md
│   └── ssh-agents/                 # SSH agent configuration
│       └── README.md
│
├── 🔌 api-control-layer/           # API / Control Layer
│   ├── README.md                   # API layer documentation
│   └── backend-stub/               # Optional custom backend service
│       ├── server.js               # Express.js backend stub
│       ├── package.json
│       └── .env.example
│
├── ☸️  helm/                       # Kubernetes deployment
│   ├── Chart.yaml
│   ├── values.yaml                 # All tunables documented
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── ingress.yaml
│       ├── pvc.yaml
│       └── hpa.yaml
│
├── 🌍 terraform/                   # Infrastructure as Code
│   ├── aws/                        # ECS + EC2 modules
│   ├── gcp/                        # GKE / Cloud Run
│   └── azure/                      # AKS
│
├── 🛠️  jpctl/                       # Go CLI bootstrapper
│   ├── main.go
│   └── cmd/
│
├── 📖 docs/                        # Documentation
│   ├── architecture.md             # Detailed architecture guide
│   ├── plugin-guide.md             # Plugin usage guide
│   ├── jcasc-reference.md          # JCasC reference
│   └── shared-library.md           # Shared library reference
│
├── docker-compose.yml              # Local dev stack
├── Makefile                        # Common tasks
└── README.md
```

---

## 🚢 Deployment

### Kubernetes via Helm

```bash
# Add the repo
helm repo add jenkins-plus https://NotHarshhaa.github.io/jenkins-plus
helm repo update

# Install with defaults
helm install jp jenkins-plus/jenkins-plus -n jenkins --create-namespace

# Install with custom values
helm install jp jenkins-plus/jenkins-plus -n jenkins --create-namespace \
  --set admin.password=mysecret \
  --set github.org=my-org \
  --set oidc.issuer=https://accounts.google.com \
  --set oidc.clientId=jenkins \
  --set agents.replicas=4 \
  --set persistence.size=50Gi \
  --set ingress.enabled=true \
  --set ingress.host=jenkins.example.com
```

### AWS via Terraform

```bash
cd terraform/aws
terraform init

terraform apply \
  -var="admin_password=mysecret" \
  -var="github_org=my-org" \
  -var="region=ap-south-1" \
  -var="instance_type=t3.large"
```

---

## 🔧 Configuration Reference

All configuration via environment variables or `values.yaml`:

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `admin` | Initial admin password (used for local dev and OIDC escape-hatch) |
| `ADMIN_EMAIL` | — | Admin email address |
| `GITHUB_ORG` | — | GitHub org for branch source discovery |
| `GITHUB_APP_ID` | — | GitHub App ID for auth |
| `GITLAB_URL` | — | Self-hosted GitLab URL |
| `OIDC_ISSUER` | — | OIDC provider URL (e.g. `https://accounts.google.com`). When set, activates OIDC SSO mode; when empty, uses local accounts (dev mode) |
| `OIDC_CLIENT_ID` | — | OIDC client ID (required when `OIDC_ISSUER` is set) |
| `OIDC_CLIENT_SECRET` | — | OIDC client secret (required when `OIDC_ISSUER` is set) |
| `VAULT_ADDR` | — | HashiCorp Vault address |
| `VAULT_TOKEN` | — | Vault auth token |
| `SLACK_WORKSPACE` | — | Slack workspace ID |
| `SLACK_TOKEN` | — | Slack bot token |
| `SONAR_URL` | — | SonarQube/SonarCloud URL |
| `SONAR_TOKEN` | — | SonarQube auth token |
| `AGENT_COUNT` | `2` | Default static agent replicas |
| `JAVA_OPTS` | `-Xmx2g` | JVM heap for Jenkins controller |
| `JENKINS_OPTS` | — | Extra Jenkins startup flags |

---

## 🔌 Using the Shared Library

### In your `Jenkinsfile`

```groovy
@Library('jenkins-plus') _

pipeline {
  agent { label 'docker' }

  environment {
    IMAGE = "my-registry/myapp:${env.BUILD_NUMBER}"
  }

  stages {
    stage('Build & Push') {
      steps {
        dockerBuild(
          image: env.IMAGE,
          dockerfile: 'Dockerfile',
          push: true,
          registry: 'my-registry'
        )
      }
    }

    stage('Security Scan') {
      steps {
        sonarScan(
          projectKey: 'myapp',
          projectName: 'My App',
          exclusions: '**/test/**'
        )
      }
    }

    stage('Deploy to Staging') {
      steps {
        helmDeploy(
          chart: 'myapp',
          release: 'myapp-staging',
          namespace: 'staging',
          values: 'helm/values-staging.yaml',
          image: env.IMAGE
        )
      }
    }
  }

  post {
    always {
      slackNotify(
        channel: '#deployments',
        status: currentBuild.result,
        mention: '@devops-team'
      )
    }
  }
}
```

---

## 🛡️ Security

jenkins-plus ships with hardened defaults. Here's what's enabled out of the box:

- ✅ CSRF protection enforced on all state-mutating endpoints
- ✅ RBAC with role-based matrix authorization
- ✅ No anonymous access (read or write)
- ✅ JNLP agent TCP port disabled (use WebSocket or tunnel)
- ✅ Agent-to-controller security enabled
- ✅ Secrets via Vault / Kubernetes Secrets — never plaintext
- ✅ TLS termination at the ingress / Nginx layer
- ✅ OIDC / LDAP — admin accounts are not local by default in production mode

To report a security vulnerability, please email **security@yourproject.io** — do not open a public GitHub issue.

---

## 🗺️ Roadmap

- [ ] **v1.0** — Core distribution: Jenkins LTS + 40 plugins + JCasC bootstrap
- [ ] **v1.1** — React dashboard (pipeline builder, log viewer, DORA metrics)
- [ ] **v1.2** — `jpctl` CLI (Go) for one-command bootstrap
- [ ] **v1.3** — Helm chart + Terraform modules (AWS, GCP, Azure)
- [ ] **v1.4** — Plugin marketplace UI with compatibility matrix
- [ ] **v2.0** — HA mode (active/passive controller cluster)
- [ ] **v2.1** — AI-powered pipeline suggestions (based on repo language detection)
- [ ] **v2.2** — Native ArgoCD integration for GitOps pipelines

Track progress and vote on features in [GitHub Projects](https://github.com/NotHarshhaa/jenkins-plus/projects).

---

## 🤝 Contributing

Contributions are very welcome! Here's how to get started:

```bash
# Fork and clone
git clone https://github.com/<your-username>/jenkins-plus
cd jenkins-plus

# Start the dev stack
make dev

# UI development (hot reload)
cd ui && npm install && npm run dev

# Run tests
make test

# Lint and format
make lint
```

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a PR. For major changes, open an issue first to discuss what you'd like to change.

All contributors are expected to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📊 Comparison

| Feature | Vanilla Jenkins | Jenkins (official Helm) | **jenkins-plus** |
|---|:---:|:---:|:---:|
| Pre-installed plugins | ❌ | ❌ | ✅ 40+ |
| JCasC out of the box | ❌ | Partial | ✅ Full |
| Modern React UI | ❌ | ❌ | ✅ |
| DORA metrics dashboard | ❌ | ❌ | ✅ |
| RBAC + OIDC pre-wired | ❌ | ❌ | ✅ |
| Built-in shared library | ❌ | ❌ | ✅ |
| Grafana dashboards | ❌ | ❌ | ✅ |
| Terraform modules | ❌ | ❌ | ✅ |
| One-command local dev | ❌ | ❌ | ✅ |
| Pinned, tested plugin set | ❌ | ❌ | ✅ |

---

## 📄 License

Released under the [Apache 2.0 License](LICENSE).

Jenkins® is a registered trademark of LF Charities Inc. This project is not affiliated with or endorsed by the Jenkins project.

---

<div align="center">

**Built with ❤️ by [Harshhaa](https://github.com/NotHarshhaa)**

If this project saves you time, please consider giving it a ⭐

[GitHub](https://github.com/NotHarshhaa/jenkins-plus) · [Docker Hub](https://hub.docker.com/r/notharshaa/jenkins-plus) · [Report Bug](https://github.com/NotHarshhaa/jenkins-plus/issues) · [Request Feature](https://github.com/NotHarshhaa/jenkins-plus/issues)

</div>