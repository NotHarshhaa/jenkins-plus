/**
 * Jenkins Plus API Backend Stub
 * 
 * This is an optional custom backend service that sits between the UI layer
 * and Jenkins Core. It provides:
 * - API proxying to Jenkins
 * - Custom authentication/authorization hooks
 * - Rate limiting
 * - Request/response transformation
 * - Multi-tenancy support
 * 
 * This is a reference implementation. Customize based on your needs.
 */

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4000;
const JENKINS_URL = process.env.JENKINS_URL || 'http://jenkins-plus:8080/jenkins';

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'jenkins-plus-api-backend' });
});

// Proxy to Jenkins API
const jenkinsProxy = createProxyMiddleware({
  target: JENKINS_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  onProxyReq: (proxyReq, req, res) => {
    // Log request
    console.log(`[Proxy] ${req.method} ${req.path} -> ${JENKINS_URL}${req.path}`);
    
    // Add custom headers if needed
    proxyReq.setHeader('X-Forwarded-By', 'jenkins-plus-api-backend');
  },
  onProxyRes: (proxyRes, req, res) => {
    // Log response
    console.log(`[Proxy] ${req.method} ${req.path} -> Status: ${proxyRes.statusCode}`);
    
    // Add CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
  },
  onError: (err, req, res) => {
    console.error(`[Proxy Error] ${err.message}`);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// Apply proxy to all /api routes
app.use('/api', jenkinsProxy);

// Example: Custom endpoint for aggregated data
app.get('/api/v1/dashboard', async (req, res) => {
  try {
    // This is a placeholder for custom aggregation logic
    // You could fetch data from Jenkins and other sources here
    res.json({
      message: 'Custom dashboard endpoint',
      data: {
        // Add your custom data here
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Example: Custom authentication middleware
app.use('/api/v1/protected', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Validate API key (implement your validation logic)
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
});

// Start server
app.listen(PORT, () => {
  console.log(`Jenkins Plus API Backend listening on port ${PORT}`);
  console.log(`Proxying to Jenkins at ${JENKINS_URL}`);
  console.log(`Health check: http://localhost:${PORT}/healthz`);
});

module.exports = app;
