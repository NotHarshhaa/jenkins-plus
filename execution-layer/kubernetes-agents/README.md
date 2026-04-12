# Kubernetes Agents (Execution Layer)

This directory contains Kubernetes pod templates for Jenkins agents in jenkins-plus.

## Overview

Kubernetes agents are dynamically provisioned pods that execute Jenkins pipeline jobs. Each pod template defines a specific build environment with the necessary tools and dependencies.

## Available Pod Templates

### docker-agent.yaml
- **Labels**: `docker`, `docker-build`
- **Containers**:
  - `jnlp` - Jenkins inbound agent
  - `docker` - Docker CLI client
  - `dind` - Docker-in-Docker daemon (privileged)
- **Use Case**: Building and pushing Docker images
- **Features**:
  - Shared `/var/lib/docker` volume for layer caching
  - Resource limits: 2 CPU, 4Gi memory for dind
  - Privileged mode for Docker daemon
  - WebSocket agent protocol

### node-agent.yaml
- **Labels**: `node`, `nodejs`
- **Containers**:
  - `jnlp` - Jenkins inbound agent
  - `node` - Node.js runtime (20.14.0-alpine3.20)
- **Use Case**: Building Node.js applications
- **Features**:
  - npm cache PVC mounted
  - Alpine-based image for smaller footprint
  - Resource limits: 1 CPU, 2Gi memory

### python-agent.yaml
- **Labels**: `python`
- **Containers**:
  - `jnlp` - Jenkins inbound agent
  - `python` - Python runtime (3.12.4-slim-bookworm)
- **Use Case**: Building Python applications
- **Features**:
  - pip cache PVC mounted
  - Debian slim base
  - Resource limits: 1 CPU, 2Gi memory

### go-agent.yaml
- **Labels**: `go`, `golang`
- **Containers**:
  - `jnlp` - Jenkins inbound agent
  - `go` - Go runtime (1.22.5-bookworm)
- **Use Case**: Building Go applications
- **Features**:
  - Go cache PVC mounted (GOPATH, GOCACHE, GOMODCACHE)
  - Resource limits: 1 CPU, 2Gi memory
  - Pre-configured Go environment variables

## Usage in Jenkinsfile

```groovy
pipeline {
  agent { label 'docker' }  // or 'node', 'python', 'go'
  
  stages {
    stage('Build') {
      steps {
        sh 'make build'
      }
    }
  }
}
```

## Configuration

Pod templates are configured in `jenkins-core/jcasc/jenkins.yaml` under the `clouds.kubernetes.podTemplates` section. The YAML files in this directory serve as reference implementations and documentation.

## Scaling

Kubernetes agents auto-scale based on demand:

- **Container Cap**: 20 concurrent pods (configurable via `containerCapStr`)
- **Instance Cap**: 10 per pod template (configurable via `instanceCap`)
- **Idle Timeout**: 5 minutes before pod termination (configurable via `idleMinutes`)

## Resource Management

Each pod template defines resource requests and limits:

| Agent | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-------|-------------|----------------|-----------|--------------|
| docker-agent | 500m | 1Gi | 4.5 CPU | 6.5Gi |
| node-agent | 100m | 256Mi | 1 CPU | 2Gi |
| python-agent | 100m | 256Mi | 1 CPU | 2Gi |
| go-agent | 100m | 256Mi | 1 CPU | 2Gi |

## Custom Pod Templates

To add a custom pod template:

1. Create a new YAML file in this directory
2. Add the pod template definition to `jenkins-core/jcasc/jenkins.yaml`
3. Apply the configuration

Example custom template:

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    jenkins-agent: custom-agent
spec:
  serviceAccountName: jenkins-agent
  containers:
    - name: jnlp
      image: jenkins/inbound-agent:3261.v9c670a_4748a_9-1
      workingDir: /home/jenkins/agent
      resources:
        requests:
          cpu: 100m
          memory: 256Mi
        limits:
          cpu: 500m
          memory: 512Mi
    - name: custom-tool
      image: your-custom-image:latest
      command: ["cat"]
      tty: true
```

## Persistence

Pod templates can use PVCs for persistent storage:

- **npm-cache**: Node.js package cache
- **pip-cache**: Python package cache
- **go-cache**: Go module and build cache
- **docker-graph-storage**: Docker layer cache (ephemeral, per-pod)

## Security Considerations

- **Privileged Containers**: Only docker-agent uses privileged mode for DinD
- **Service Accounts**: All pods use `jenkins-agent` service account
- **Resource Limits**: All pods have resource limits to prevent runaway processes
- **Image Pull Secrets**: Configured for private registries via `imagePullSecrets`

## Troubleshooting

### Pods Not Starting
- Check Kubernetes node resources
- Verify service account permissions
- Check pod events: `kubectl describe pod <pod-name>`

### Build Failures
- Verify tool versions in container images
- Check resource limits are sufficient
- Review pod logs: `kubectl logs <pod-name> -c <container-name>`

### Cache Not Working
- Verify PVCs are created and mounted
- Check PVC storage class
- Review pod volume mounts

## Environment Variables

Common environment variables available in all agents:

- `JENKINS_AGENT_WORKDIR`: Agent working directory
- `HOME`: Home directory
- Container-specific variables (e.g., `DOCKER_HOST` for docker-agent)

## Notes

- Pod templates are defined inline in JCasC for simplicity
- External YAML files in this directory are for reference only
- For production, consider using custom resource limits based on workload
- Monitor pod resource usage via Kubernetes metrics
