# API Backend Stub

This is a reference implementation of an optional custom backend service for the Jenkins Plus API/Control layer.

## Purpose

This backend stub demonstrates how to implement a custom API layer between the UI and Jenkins Core. Use cases include:

- Custom authentication/authorization
- API rate limiting
- Request/response transformation
- Multi-tenancy support
- Aggregation of multiple Jenkins instances
- Integration with external services

## Quick Start

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the server
npm start

# Or in development mode with auto-reload
npm run dev
```

The server will start on port 4000 (configurable via PORT env var).

## Endpoints

### Health Check
```
GET /healthz
```

Returns service health status.

### Jenkins API Proxy
```
/api/*
```
Proxies all requests to Jenkins REST API.

Example:
```bash
curl http://localhost:4000/api/json --user admin:admin
```

### Custom Dashboard Endpoint
```
GET /api/v1/dashboard
```
Placeholder for custom dashboard aggregation logic.

### Protected Endpoint
```
GET /api/v1/protected
```
Requires X-API-Key header for authentication.

## Configuration

See `.env.example` for all configuration options.

## Integration with Docker Compose

To use this backend with the main jenkins-plus stack, add to `docker-compose.yml`:

```yaml
api-backend:
  build: ./api-control-layer/backend-stub
  container_name: jenkins-plus-api-backend
  restart: unless-stopped
  ports:
    - "4000:4000"
  environment:
    - JENKINS_URL=http://jenkins-plus:8080/jenkins
    - JENKINS_API_USER=${JENKINS_API_USER:-admin}
    - JENKINS_API_PASSWORD=${JENKINS_API_PASSWORD:-admin}
  networks:
    - jenkins-net
  depends_on:
    jenkins-plus:
      condition: service_healthy
```

Then update nginx configuration to route to this backend instead of directly to Jenkins.

## Customization

This is a stub implementation. Customize it based on your needs:

1. **Authentication**: Add OAuth, JWT, or custom auth logic
2. **Rate Limiting**: Implement rate limiting middleware
3. **Caching**: Add Redis or in-memory caching
4. **Logging**: Integrate with your logging system
5. **Monitoring**: Add Prometheus metrics
6. **Validation**: Add request validation schemas

## Security Notes

- This stub does not implement authentication by default
- Add proper authentication/authorization for production
- Use HTTPS in production
- Implement rate limiting to prevent abuse
- Validate and sanitize all inputs
- Keep dependencies updated
