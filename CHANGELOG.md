# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-01-XX

### Added

#### Core Jenkins Distribution
- Hardened Jenkins LTS 2.504 with zero click-ops setup
- 50+ pre-installed and tested plugins (pinned versions)
- JCasC (Configuration as Code) bootstrap with full jenkins.yaml
- WebSocket agent protocol (JNLP TCP port disabled for security)
- Shared Groovy library bundled in the image
- RBAC with project matrix authorization (no anonymous access)
- OIDC/SSO pre-wired with escape-hatch for local accounts
- CSRF protection enabled by default
- Agent-to-controller security enabled

#### Plugin Engine
- **SCM Plugins**: Git, GitHub Branch Source, GitLab, Bitbucket
- **Pipeline Plugins**: Workflow Aggregator, Multibranch, Job DSL, Pipeline Graph View
- **Agent Plugins**: Kubernetes, Docker, SSH Build Agents
- **Security Plugins**: Matrix Auth, OIDC, Credentials, HashiCorp Vault
- **Quality Plugins**: JUnit, Cobertura, SonarQube, OWASP Dependency-Check
- **Notification Plugins**: Slack, Email Extension, Generic Webhook Trigger
- **Observability Plugins**: Prometheus, OpenTelemetry, Build Monitor
- **Ops Plugins**: Throttle Concurrent Builds, Priority Sorter, Timestamper, AnsiColor

#### Shared Library (jenkins-plus)
- `dockerBuild()` - Build and push Docker images with registry support
- `helmDeploy()` - Helm chart deployment with atomic upgrades
- `sonarScan()` - SonarQube analysis with quality gate
- `slackNotify()` - Slack notifications with build context
- `owaspScan()` - OWASP Dependency-Check with HTML report publishing
- Utility classes: PipelineUtils, DockerUtils (Serializable)

#### Kubernetes Pod Templates
- docker-agent: jnlp + docker CLI + dind (privileged)
- node-agent: jnlp + Node.js 20.14.0 with npm cache PVC
- python-agent: jnlp + Python 3.12.4 with pip cache PVC
- go-agent: jnlp + Go 1.22.5 with go cache PVC

#### Modern UI (Next.js 14)
- React dashboard with shadcn/ui components
- Dark mode support via next-themes
- Drag-and-drop pipeline builder with @dnd-kit
- Live log viewer with ANSI color support
- DORA metrics dashboard with Recharts
- Plugin marketplace with compatibility matrix
- Builds table with real-time status
- SWR for data fetching with optimistic updates

#### Infrastructure
- **Docker Compose**: Complete local dev stack (Jenkins + agents + Prometheus + Grafana + nginx + UI)
- **Helm Chart**: Production-ready Kubernetes deployment with:
  - Configurable resource limits
  - Horizontal Pod Autoscaler
  - ServiceMonitor for Prometheus
  - Ingress with WebSocket support
  - PVC for Jenkins home persistence
- **Terraform Modules**:
  - AWS: EC2 + EBS + Security Groups
  - GCP: GKE + Cloud Run
  - Azure: AKS + Container Registry

#### jpctl CLI
- `jpctl up` - Bootstrap local stack with docker compose
- `jpctl down` - Tear down the stack
- `jpctl status` - Check service health
- `jpctl logs` - Stream Jenkins logs
- `jpctl plugin install/list` - Plugin management
- `jpctl config` - View and edit configuration

#### Observability
- Prometheus metrics endpoint at `/prometheus`
- Pre-built Grafana dashboards (Jenkins overview, DORA metrics)
- OpenTelemetry traces and metrics export
- Build performance monitoring

#### Documentation
- Complete README with quick start guide
- Architecture documentation
- Plugin guide with all 50+ plugins
- JCasC reference with all env vars
- Shared library API documentation
- Deployment guides (Docker, Kubernetes, AWS, GCP, Azure)
- Troubleshooting guide

### Security

- CSRF protection enforced on all state-mutating endpoints
- RBAC with role-based matrix authorization
- No anonymous access (deny-by-default)
- JNLP agent TCP port disabled (WebSocket only)
- Agent-to-controller security enabled
- Secrets via Vault/Kubernetes Secrets (never plaintext env vars)
- TLS termination at ingress/nginx layer
- OIDC/LDAP pre-wired for production

### Changed

- Removed need for manual plugin installation
- Removed need for manual JCasC configuration
- Removed need for manual agent configuration
- Removed need for manual UI setup

### Fixed

- WebSocket agent connection issues
- CSRF crumb header handling
- Plugin compatibility between versions
- Environment variable substitution in JCasC

### Dependencies

- Jenkins LTS 2.504
- Next.js 14.2.5
- React 18.3.1
- Go 1.22
- 50+ Jenkins plugins (pinned versions)

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

[Unreleased]: https://github.com/NotHarshhaa/jenkins-plus/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/NotHarshhaa/jenkins-plus/releases/tag/v1.0.0
