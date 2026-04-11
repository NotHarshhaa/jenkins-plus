# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in jenkins-plus, please report it responsibly.

**DO NOT** open a public GitHub issue.

### How to Report

Send an email to: **security@notHarshhaa.dev**

Include the following information in your report:
- Description of the vulnerability
- Steps to reproduce the vulnerability
- Potential impact
- Any suggested mitigation or fix

### What to Expect

- We will acknowledge receipt of your report within 48 hours
- We will provide a detailed response within 7 days
- We will work with you to understand and resolve the issue
- We will coordinate a release date for the fix with you

### Disclosure Timeline

We aim to:
- Fix critical vulnerabilities within 7 days of disclosure
- Fix high severity vulnerabilities within 14 days
- Fix medium severity vulnerabilities within 30 days
- Fix low severity vulnerabilities within 90 days

## Supported Versions

| Version | Security Support |
|---------|------------------|
| 1.0.x   | Yes              |
| < 1.0    | No               |

Only the latest minor version (1.0.x) receives security updates. Older versions may receive critical security patches at the maintainers' discretion.

## Security Best Practices

### For Users

1. **Never expose Jenkins publicly without authentication**
   - Always use OIDC or strong admin passwords
   - Enable HTTPS in production
   - Use firewall rules to restrict access

2. **Keep plugins updated**
   - Use the bundled plugin set (pinned and tested together)
   - Review plugin updates before applying
   - Use the jpctl CLI for safe plugin management

3. **Use secrets management**
   - Store sensitive data in HashiCorp Vault or Kubernetes Secrets
   - Never commit secrets to git
   - Rotate credentials regularly

4. **Enable audit logging**
   - Review Jenkins logs regularly
   - Monitor for unauthorized access attempts
   - Set up alerts for suspicious activity

### For Deployments

1. **Network isolation**
   - Run Jenkins in a private VPC/subnet
   - Use a bastion host for access
   - Restrict inbound traffic to necessary ports only

2. **Resource limits**
   - Set CPU and memory limits on containers
   - Monitor resource usage
   - Configure horizontal pod autoscaling

3. **Backup and recovery**
   - Regularly backup Jenkins home volume
   - Test restore procedures
   - Document recovery procedures

## Security Features in jenkins-plus

jenkins-plus includes several security features out of the box:

- **CSRF protection** - Enabled by default
- **RBAC** - Project matrix authorization with no anonymous access
- **JNLP disabled** - WebSocket agents only (no TCP port 50000)
- **OIDC/SSO** - Pre-configured for enterprise authentication
- **Secrets integration** - HashiCorp Vault and Kubernetes Secrets support
- **Security headers** - CSP and other browser security headers
- **Agent-to-controller security** - Enabled by default

## Dependency Scanning

jenkins-plus includes:
- OWASP Dependency-Check plugin for vulnerability scanning
- SonarQube integration for code quality and security analysis
- Regular dependency updates via automated workflows

## Receiving Security Updates

To receive security updates:

1. Watch the GitHub repository for releases
2. Subscribe to the [Security Advisories](https://github.com/NotHarshhaa/jenkins-plus/security/advisories)
3. Follow the project on social media for announcements

## Security Questions?

For security-related questions that are not vulnerability reports, please open a GitHub discussion with the `security` label.
