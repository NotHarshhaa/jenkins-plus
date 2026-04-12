# Docker Agents (Execution Layer)

This directory contains configuration and documentation for Docker-based build agents in jenkins-plus.

## Overview

Docker agents are used for containerized build environments where you need full Docker capabilities (build, push, run containers). These agents run as static containers in the Docker Compose setup.

## Configuration

The Docker agent is configured in `docker-compose.yml` under the `jenkins-agent` service:

```yaml
jenkins-agent:
  image: jenkins/inbound-agent:latest-jdk21
  restart: unless-stopped
  deploy:
    replicas: 2
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - JENKINS_URL=${JENKINS_URL:-http://jenkins-plus:8080}
    - JENKINS_WEB_SOCKET=true
    - JENKINS_AGENT_NAME=${JENKINS_AGENT_NAME:-docker-agent}
    - JENKINS_SECRET=${JENKINS_AGENT_SECRET:-}
    - JENKINS_AGENT_WORKDIR=/home/jenkins/agent
```

## Usage in Jenkinsfile

```groovy
pipeline {
  agent { label 'docker-agent' }
  
  stages {
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t myapp:${BUILD_NUMBER} .'
      }
    }
    
    stage('Test Container') {
      steps {
        sh 'docker run --rm myapp:${BUILD_NUMBER} npm test'
      }
    }
  }
}
```

## Scaling

To scale the number of Docker agents, modify the `replicas` value in `docker-compose.yml` or use:

```bash
docker compose up -d --scale jenkins-agent=4
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JENKINS_URL` | `http://jenkins-plus:8080` | Jenkins controller URL |
| `JENKINS_WEB_SOCKET` | `true` | Use WebSocket for agent connection |
| `JENKINS_AGENT_NAME` | `docker-agent` | Agent display name |
| `JENKINS_SECRET` | - | Agent secret (auto-generated in production) |
| `JENKINS_AGENT_WORKDIR` | `/home/jenkins/agent` | Agent working directory |

## Notes

- Docker socket is mounted from the host, giving agents access to the host's Docker daemon
- For production, consider using Docker-in-Docker (DinD) or Kubernetes pod templates instead
- Static agents are suitable for local development and small-scale deployments
- For large-scale production, use Kubernetes agents (see `../kubernetes-agents/`)
