# API / Control Layer

This directory contains documentation and optional components for the API/Control layer in jenkins-plus.

## Overview

The API/Control layer sits between the UI layer and Jenkins Core, providing:

1. **Jenkins REST API** - Native Jenkins API for all operations
2. **Optional Custom Backend Service** - Extensible middleware for advanced use cases

## Jenkins REST API

The primary API is Jenkins' built-in REST API, accessible at:

- **Base URL**: `http://localhost:8080/jenkins/api/`
- **Documentation**: `http://localhost:8080/jenkins/api/`
- **Authentication**: Required (OIDC or basic auth)

### Common Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/json` | GET | Jenkins system information |
| `/api/json?tree=jobs[name,color,lastBuild[number,result]]` | GET | Jobs with details |
| `/job/{name}/api/json` | GET | Job configuration |
| `/job/{name}/build` | POST | Trigger build |
| `/job/{name}/{buildNumber}/api/json` | GET | Build details |
| `/job/{name}/{buildNumber}/consoleText` | GET | Build logs |
| `/computer/api/json` | GET | Agent status |
| `/pluginManager/api/json` | GET | Plugin information |

### Example: Trigger Build

```bash
curl -X POST http://localhost:8080/jenkins/job/my-job/build \
  --user admin:admin \
  -H "Jenkins-Crumb: $(curl -s 'http://localhost:8080/jenkins/crumbIssuer/api/xml' \
  --user admin:admin | grep '<crumb>' | sed 's/.*<crumb>\(.*\)<\/crumb>.*/\1/')"
```

### Example: Get Build Status

```bash
curl -s http://localhost:8080/jenkins/job/my-job/lastBuild/api/json \
  --user admin:admin | jq '.result'
```

## Optional Custom Backend Service

For advanced use cases, you can implement a custom backend service that:

- Provides additional authentication/authorization logic
- Implements custom rate limiting
- Adds caching layers
- Provides unified API across multiple Jenkins instances
- Implements custom business logic

### Architecture with Custom Backend

```
UI Layer
    ↓
Custom Backend Service (Optional)
    ↓
Jenkins REST API
    ↓
Jenkins Core
```

### Backend Service Stub

A minimal Node.js/Express backend stub is provided in `backend-stub/` for reference.

### When to Use Custom Backend

Consider a custom backend when you need:

- **Multi-tenancy** - Separate API keys per team
- **API aggregation** - Combine Jenkins with other tools (GitHub, GitLab, etc.)
- **Custom auth** - Additional authentication layers beyond OIDC
- **Rate limiting** - Protect Jenkins from API abuse
- **Caching** - Cache frequently accessed data
- **Webhook handling** - Process webhooks before forwarding to Jenkins

### Example: Simple Proxy Backend

```javascript
// backend-stub/server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Proxy to Jenkins API
app.use('/api', createProxyMiddleware({
  target: 'http://jenkins-plus:8080/jenkins',
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  onProxyReq: (proxyReq, req, res) => {
    // Add custom headers
    proxyReq.setHeader('X-Custom-Header', 'jenkins-plus');
  }
}));

app.listen(4000, () => {
  console.log('API backend listening on port 4000');
});
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `JENKINS_API_URL` | `http://localhost:8080/jenkins` | Jenkins API base URL |
| `JENKINS_API_USER` | `admin` | API username |
| `JENKINS_API_PASSWORD` | `admin` | API password/token |
| `CUSTOM_BACKEND_ENABLED` | `false` | Enable custom backend service |
| `CUSTOM_BACKEND_PORT` | `4000` | Custom backend port |

## Security Considerations

1. **Always use HTTPS** in production for API calls
2. **Use API tokens** instead of passwords for programmatic access
3. **Implement rate limiting** on the API layer
4. **Validate all input** in custom backends
5. **Keep Jenkins Crumb protection** enabled for CSRF protection
6. **Use OIDC** for authentication when possible
7. **Restrict API access** via network policies

## Monitoring

Monitor API health via:

- **Prometheus metrics**: `http://localhost:8080/jenkins/prometheus/`
- **Response times**: Track API latency
- **Error rates**: Monitor 4xx/5xx responses
- **Rate limiting**: Track API usage patterns

## Documentation Links

- [Jenkins Remote Access API](https://www.jenkins.io/doc/book/using/remote-access-api/)
- [Jenkins API Client Libraries](https://www.jenkins.io/doc/book/using/remote-access-api/#clients)
- [Jenkins Script Console](https://www.jenkins.io/doc/book/managing/script-console/)
