# Jenkins Plus Architecture

This document provides a detailed explanation of the Jenkins Plus architecture, including each layer, its components, and how they interact.

## Overview

Jenkins Plus follows a layered architecture that separates concerns and enables modularity. The architecture consists of five main layers:

1. **UI Layer** - User interface and interaction
2. **API / Control Layer** - API gateway and control plane
3. **Jenkins Core (Execution Engine)** - Core Jenkins functionality
4. **Execution Layer (Agents)** - Build execution environments
5. **Infrastructure Layer** - Deployment infrastructure

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

## Layer 1: UI Layer

### Purpose
The UI Layer provides a modern, user-friendly interface for interacting with Jenkins. It replaces the classic Jenkins UI with a contemporary React-based dashboard.

### Components

#### React Dashboard
- **Location**: `ui/app/dashboard/`
- **Technology**: Next.js 14, React, Tailwind CSS
- **Features**:
  - Real-time build status
  - Job overview and statistics
  - Quick actions for common tasks
  - Responsive design

#### Pipeline Builder
- **Location**: `ui/app/pipeline-builder/`
- **Technology**: React, @dnd-kit (drag-and-drop)
- **Features**:
  - Visual drag-and-drop pipeline editor
  - Automatic Jenkinsfile generation
  - Stage templates
  - Validation and syntax checking

#### DORA Metrics Dashboard
- **Location**: `ui/app/dora/`
- **Technology**: React, Recharts
- **Features**:
  - Deploy frequency tracking
  - Lead time for changes
  - Mean Time to Recovery (MTTR)
  - Change failure rate
  - Historical trends and visualizations

#### Plugin Marketplace
- **Location**: `ui/app/plugins/`
- **Technology**: React, SWR
- **Features**:
  - Plugin browsing and search
  - Compatibility checking
  - One-click installation
  - Version management

#### Log Viewer
- **Location**: `ui/components/log-viewer/`
- **Technology**: React, ansi-to-html
- **Features**:
  - Real-time log streaming
  - ANSI color support
  - Full-text search
  - Log filtering and highlighting

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui primitives
- **Styling**: Tailwind CSS with dark mode
- **State Management**: React hooks, SWR
- **Icons**: lucide-react
- **Build Tool**: Turbopack

### Access
- **Local**: http://localhost:3000
- **Via Nginx**: http://localhost/ (proxied to UI container)

## Layer 2: API / Control Layer

### Purpose
The API / Control Layer serves as the gateway between the UI and Jenkins Core. It provides REST API access and optional custom backend services for advanced use cases.

### Components

#### Jenkins REST API
- **Base URL**: `http://localhost:8080/jenkins/api/`
- **Authentication**: OIDC or basic auth
- **Features**:
  - Job management (create, build, delete)
  - Build status and logs
  - Agent management
  - Plugin management
  - Credentials management
  - System configuration

#### Optional Custom Backend Service
- **Location**: `api-control-layer/backend-stub/`
- **Technology**: Node.js, Express.js
- **Purpose**: Extensible middleware for:
  - Custom authentication/authorization
  - Rate limiting
  - Request/response transformation
  - API aggregation
  - Multi-tenancy support
  - Caching layers

### API Endpoints

#### Common Jenkins API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/json` | GET | System information |
| `/job/{name}/api/json` | GET | Job configuration |
| `/job/{name}/build` | POST | Trigger build |
| `/job/{name}/{buildNumber}/consoleText` | GET | Build logs |
| `/computer/api/json` | GET | Agent status |
| `/pluginManager/api/json` | GET | Plugin information |

### Security
- CSRF protection via Crumb Issuer
- OIDC authentication for production
- API token support for programmatic access
- Rate limiting (via custom backend)

### Documentation
See `api-control-layer/README.md` for detailed API documentation and backend service setup.

## Layer 3: Jenkins Core (Execution Engine)

### Purpose
Jenkins Core is the heart of the system, responsible for pipeline execution, job scheduling, and core functionality.

### Components

#### JCasC (Configuration as Code)
- **Location**: `jenkins-core/jcasc/jenkins.yaml`
- **Purpose**: Declarative Jenkins configuration
- **Features**:
  - Security realm (OIDC, LDAP)
  - Authorization strategy (RBAC)
  - Cloud configurations (Kubernetes, SSH)
  - Credentials management
  - Global tools configuration
  - Seed jobs

#### Plugin System
- **Location**: `jenkins-core/plugin-system/`
- **Files**:
  - `plugins.txt` - 50+ pinned plugins
  - `plugin-compat-matrix.json` - Compatibility matrix
- **Categories**:
  - **SCM**: Git, GitHub, GitLab, Bitbucket
  - **Pipeline**: Multibranch, Job DSL, Pipeline Replay
  - **Agents**: Kubernetes, Docker, SSH
  - **Security**: Matrix Auth, OIDC, Credentials, Vault
  - **Quality**: JUnit, SonarQube, OWASP Dependency Check
  - **Notifications**: Slack, Email, Webhook
  - **Observability**: Prometheus, OpenTelemetry
  - **Ops**: Throttle, Priority Sorter, Timestamper

#### Shared Library
- **Location**: `jenkins-core/shared-library/`
- **Purpose**: Reusable pipeline logic
- **Components**:
  - `vars/dockerBuild.groovy` - Docker build and push
  - `vars/helmDeploy.groovy` - Helm deployment
  - `vars/sonarScan.groovy` - SonarQube scanning
  - `vars/slackNotify.groovy` - Slack notifications
  - `vars/owaspScan.groovy` - OWASP dependency check
  - `src/org/jenkinsplus/` - Utility classes

#### Security Layer
- **RBAC**: Matrix authorization strategy
- **OIDC**: OpenID Connect for SSO
- **CSRF Protection**: Crumb issuer enabled
- **Agent Security**: Agent-to-controller security
- **Secrets Management**: HashiCorp Vault integration

### Configuration
All configuration is managed via:
- Environment variables (with defaults)
- JCasC YAML files
- No manual UI configuration required

### Documentation
See `jenkins-core/` directory for detailed configuration files.

## Layer 4: Execution Layer (Agents)

### Purpose
The Execution Layer provides the environments where build jobs actually run. Jenkins Core delegates work to these agents.

### Components

#### Kubernetes Agents
- **Location**: `execution-layer/kubernetes-agents/`
- **Pod Templates**:
  - `docker-agent.yaml` - Docker build environment with DinD
  - `node-agent.yaml` - Node.js build environment
  - `python-agent.yaml` - Python build environment
  - `go-agent.yaml` - Go build environment
- **Features**:
  - Dynamic pod provisioning
  - Resource limits and requests
  - PVC mounting for caching
  - Custom container images
  - Affinity and anti-affinity rules

#### Docker Agents
- **Location**: `execution-layer/docker-agents/`
- **Configuration**: Static containers in docker-compose.yml
- **Features**:
  - Host Docker socket access
  - Scalable via docker-compose scale
  - Suitable for local development
- **Documentation**: `execution-layer/docker-agents/README.md`

#### SSH Agents
- **Location**: `execution-layer/ssh-agents/`
- **Configuration**: Via JCasC in Jenkins Core
- **Features**:
  - Remote server execution
  - Key-based authentication
  - Multiple agent support
  - Host key verification
- **Use Cases**:
  - Building on specific hardware
  - Deploying to target environments
  - Hybrid cloud scenarios
- **Documentation**: `execution-layer/ssh-agents/README.md`

### Agent Selection
Agents are selected via labels in Jenkinsfiles:
```groovy
agent { label 'docker' }        // Docker agent
agent { label 'kubernetes' }    // Kubernetes agent
agent { label 'ssh-agent' }     // SSH agent
```

### Scaling
- **Kubernetes**: Auto-scales based on demand
- **Docker**: Manual scaling via docker-compose
- **SSH**: Static configuration, managed via infrastructure

## Layer 5: Infrastructure Layer

### Purpose
The Infrastructure Layer provides the deployment and orchestration mechanisms for running Jenkins Plus across different environments.

### Components

#### Docker Compose
- **Location**: `docker-compose.yml`
- **Use Case**: Local development and testing
- **Services**:
  - Jenkins controller
  - Static Docker agents
  - Nginx reverse proxy
  - Prometheus metrics
  - Grafana dashboards
  - Next.js UI

#### Helm Chart
- **Location**: `helm/`
- **Use Case**: Kubernetes production deployments
- **Features**:
  - Configurable via values.yaml
  - Ingress support
  - PVC for persistence
  - HPA for autoscaling
  - Service accounts and RBAC

#### Terraform Modules
- **Location**: `terraform/`
- **Cloud Providers**:
  - `aws/` - ECS and EC2 deployments
  - `gcp/` - GKE and Cloud Run
  - `azure/` - AKS deployments
- **Features**:
  - Infrastructure as Code
  - Multi-cloud support
  - State management
  - Modular design

### Deployment Options

#### Local Development
```bash
docker compose up -d
```

#### Kubernetes (Helm)
```bash
helm install jenkins-plus ./helm -n jenkins
```

#### AWS (Terraform)
```bash
cd terraform/aws
terraform apply
```

## Data Flow

### Build Execution Flow
1. User triggers build via UI or API
2. Nginx routes request to Jenkins Core
3. Jenkins Core schedules job on available agent
4. Agent provisions environment (Kubernetes pod, Docker container, SSH connection)
5. Agent executes pipeline steps
6. Logs stream back to Jenkins Core
7. UI polls Jenkins API for build status
8. Prometheus collects metrics
9. Grafana visualizes metrics

### Configuration Flow
1. Environment variables set at deployment
2. JCasC reads variables and applies configuration
3. Jenkins Core boots with configuration
4. UI reads configuration via API
5. Changes can be made via JCasC or UI (persisted to JCasC)

## Security Architecture

### Authentication
- **OIDC**: Primary authentication method for production
- **Basic Auth**: Fallback for local development
- **API Tokens**: For programmatic access
- **Escape Hatch**: Admin account for initial setup

### Authorization
- **RBAC**: Matrix authorization strategy
- **Role-Based**: Admin, authenticated, anonymous permissions
- **Project-Based**: Per-project access control

### Network Security
- **TLS Termination**: At Nginx/Ingress layer
- **Internal Communication**: Via docker network/Kubernetes service mesh
- **Agent Connections**: WebSocket (no JNLP TCP)
- **CSRF Protection**: Crumb issuer enabled

### Secrets Management
- **HashiCorp Vault**: Production secrets storage
- **Kubernetes Secrets**: For K8s deployments
- **Environment Variables**: For local development (not recommended for production)
- **Credentials Plugin**: Jenkins credentials store

## Monitoring and Observability

### Metrics
- **Prometheus**: Scrapes metrics at `/prometheus`
- **Jenkins Metrics**: Build counts, queue size, executor usage
- **Custom Metrics**: DORA metrics, plugin usage

### Logging
- **Jenkins Logs**: Container logs, accessible via docker logs/kubectl logs
- **Build Logs**: Stored in Jenkins, accessible via UI and API
- **Nginx Logs**: Access and error logs for reverse proxy

### Tracing
- **OpenTelemetry**: Distributed tracing for pipelines
- **Correlation IDs**: Trace requests across layers

### Dashboards
- **Grafana**: Pre-built dashboards for:
  - Jenkins overview
  - Build performance
  - Agent utilization
  - DORA metrics

## Scalability

### Horizontal Scaling
- **UI**: Scale via Kubernetes HPA or multiple instances behind load balancer
- **Jenkins Core**: Active/passive HA mode (planned v2.0)
- **Agents**: Kubernetes auto-scales based on demand

### Vertical Scaling
- **Jenkins Controller**: Adjust JVM heap via `JAVA_OPTS`
- **Agents**: Adjust resource limits in pod templates
- **Database**: Externalize Jenkins home for better performance

## Migration Path

### From Old Architecture
The new architecture introduces:
1. **Explicit API Layer**: Separates API concerns from Jenkins Core
2. **Execution Layer**: Clearly separates agent types
3. **Modular Structure**: Better organization of components

### Compatibility
- **Backward Compatible**: Old Jenkinsfiles still work
- **Plugin Compatibility**: All existing plugins supported
- **API Compatibility**: Jenkins REST API unchanged

### Migration Steps
1. Update directory structure (already done)
2. Update deployment configurations
3. Migrate custom agents to new structure
4. Enable optional API backend if needed
5. Update monitoring to use new endpoints

## Best Practices

### Development
- Use Docker Compose for local development
- Enable hot reload for UI development
- Use environment variables for configuration
- Keep JCasC in version control

### Production
- Use Kubernetes or Terraform for deployment
- Enable OIDC for authentication
- Use external secrets management (Vault)
- Enable TLS termination at ingress
- Configure resource limits
- Set up monitoring and alerting
- Regular backup of Jenkins home

### Security
- Never use default credentials in production
- Enable RBAC and limit permissions
- Use API tokens instead of passwords
- Keep plugins updated
- Regular security audits
- Network segmentation

## Troubleshooting

### Common Issues

#### UI Not Loading
- Check UI container logs
- Verify Nginx configuration
- Check network connectivity

#### Builds Not Starting
- Check agent availability
- Verify agent labels
- Check Jenkins queue
- Review agent logs

#### Authentication Failures
- Verify OIDC configuration
- Check escape hatch credentials
- Review RBAC settings
- Check network connectivity to OIDC provider

#### Performance Issues
- Check JVM heap size
- Review executor configuration
- Check agent resource limits
- Review build history and cleanup

## References

- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [JCasC Documentation](https://www.jenkins.io/doc/book/managing/configuration-as-code/)
- [Kubernetes Plugin](https://plugins.jenkins.io/kubernetes/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

## Contributing

When contributing to Jenkins Plus architecture:
1. Maintain layer separation
2. Follow existing patterns
3. Update documentation
4. Add tests for new components
5. Consider backward compatibility

## License

Apache 2.0 - See LICENSE file for details.
