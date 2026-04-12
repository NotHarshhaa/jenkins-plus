# SSH Agents (Execution Layer)

This directory contains configuration and documentation for SSH-based build agents in jenkins-plus.

## Overview

SSH agents allow Jenkins to execute builds on remote servers via SSH. This is useful for:

- Building on specific hardware (e.g., ARM, GPU machines)
- Deploying to target environments
- Running builds on existing infrastructure
- Hybrid cloud scenarios (on-prem + cloud)

## Configuration

SSH agents are configured via Jenkins JCasC in `jenkins-core/jcasc/jenkins.yaml`:

```yaml
unclassified:
  sshAgent:
    credentials:
      - ssh-key-id
```

## Setting Up an SSH Agent

### 1. Create SSH Credentials

Add SSH credentials to Jenkins:

```bash
# Via Jenkins UI
# Manage Jenkins > Credentials > System > Global credentials > Add Credentials
# Kind: SSH Username with private key
# Username: your-ssh-user
# Private Key: Enter directly or from file
```

### 2. Configure SSH Agent in JCasC

Add to `jenkins-core/jcasc/jenkins.yaml`:

```yaml
jenkins:
  clouds:
    - ssh:
        name: "ssh-build-agents"
        host: "build-server.example.com"
        port: 22
        credentialsId: "ssh-key-id"
        jenkinsUrl: "${JENKINS_URL:-http://jenkins:8080}"
        maxNumConcurrentAgents: 5
        labelString: "ssh-agent linux"
        sshHostKeyVerificationStrategy:
          knownHosts:
            knownHostsFile: "/var/jenkins_home/.ssh/known_hosts"
```

### 3. Usage in Jenkinsfile

```groovy
pipeline {
  agent { label 'ssh-agent' }
  
  stages {
    stage('Build on Remote Server') {
      steps {
        sh 'make build'
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SSH_HOST` | - | Remote server hostname |
| `SSH_PORT` | `22` | SSH port |
| `SSH_CREDENTIALS_ID` | - | Jenkins credentials ID for SSH key |
| `SSH_LABEL` | `ssh-agent` | Agent label for job assignment |

## Security Best Practices

1. **Use SSH keys, not passwords** - Configure SSH username with private key credentials
2. **Limit agent permissions** - Use least-privilege SSH accounts
3. **Enable host key verification** - Prevent MITM attacks
4. **Use bastion hosts** - For production, route through bastion/jump hosts
5. **Rotate keys regularly** - Implement key rotation policies
6. **Use agent-specific accounts** - Don't use personal SSH accounts for CI/CD

## Example: Multiple SSH Agents

```yaml
jenkins:
  clouds:
    - ssh:
        name: "production-build-server"
        host: "prod-build.example.com"
        credentialsId: "prod-ssh-key"
        labelString: "ssh-agent production"
        
    - ssh:
        name: "arm-build-server"
        host: "arm-build.example.com"
        credentialsId: "arm-ssh-key"
        labelString: "ssh-agent arm"
```

## Troubleshooting

### Connection Refused
- Verify SSH service is running on remote host
- Check firewall rules allow Jenkins controller to connect
- Verify correct port (default 22)

### Authentication Failed
- Verify credentials ID exists in Jenkins
- Check SSH key format (use RSA or ED25519)
- Ensure private key has correct permissions

### Host Key Verification Failed
- Add host to known_hosts file
- Or configure `nonVerifyingKeyVerificationStrategy` (not recommended for production)

## Notes

- SSH agents are persistent connections maintained by the Jenkins controller
- For dynamic, ephemeral agents, consider Kubernetes agents instead
- SSH agents are ideal for legacy infrastructure and hybrid deployments
