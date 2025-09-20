#!/usr/bin/env node

/**
 * Health check script for Docker container
 * This script is used by Docker HEALTHCHECK instruction
 */

import http from 'http';

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000,
};

const healthCheck = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    console.error(`Health check failed with status: ${res.statusCode}`);
    process.exit(1); // Failure
  }
});

healthCheck.on('error', (err) => {
  console.error('Health check request failed:', err.message);
  process.exit(1); // Failure
});

healthCheck.on('timeout', () => {
  console.error('Health check timed out');
  healthCheck.destroy();
  process.exit(1); // Failure
});

healthCheck.end();