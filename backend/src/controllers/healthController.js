const { successResponse, errorResponse } = require('../utils/responseHelper');
const mongoose = require('mongoose');
const { isDbReady, getShuttingDownStatus } = require('../config/db');
const AIClientService = require('../services/aiClientService');

const dbStateMap = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting',
};

/**
 * GET /api/v1/health (Liveness Probe)
 * Indicates whether the Node.js process is running and able to handle HTTP events.
 * Does not expose secrets, credentials, or internal stack traces.
 */
const getHealthStatus = (req, res) => {
  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'Unknown';

  return successResponse(res, 200, 'SkillBridge API is operating normally', {
    service: 'SkillBridge Backend API',
    status: 'UP',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
  });
};

/**
 * GET /api/v1/ready (Readiness Probe)
 * Returns HTTP 200 only when MongoDB is connected and application dependencies are ready.
 * Returns HTTP 503 Service Unavailable when MongoDB is disconnected, connecting, or shutting down.
 * Bounded timeout check for AI microservice dependency.
 * Never exposes credentials or internal error stack traces.
 */
const getReadinessStatus = (req, res) => {
  const isReady = isDbReady();
  const shuttingDown = getShuttingDownStatus();
  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'Unknown';

  if (!isReady || shuttingDown) {
    return res.status(503).json({
      success: false,
      status: 'NOT_READY',
      message: shuttingDown
        ? 'Service is shutting down'
        : (!isReady ? 'Database dependency not ready' : 'Service dependencies not ready'),
      dependencies: {
        database: {
          status: dbStatus,
          ready: isReady,
        },
        server: {
          acceptingTraffic: !shuttingDown,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }

  // Asynchronous dependency check for AI microservice
  AIClientService.checkHealth(2500).then((aiHealth) => {
    const aiReady = aiHealth.status === 'HEALTHY';
    if (!aiReady) {
      return res.status(503).json({
        success: false,
        status: 'NOT_READY',
        message: 'AI microservice dependency not ready',
        dependencies: {
          database: {
            status: dbStatus,
            ready: true,
          },
          aiService: {
            status: aiHealth.status,
            ready: false,
          },
          server: {
            acceptingTraffic: true,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      status: 'READY',
      message: 'All service dependencies are ready to accept traffic',
      dependencies: {
        database: {
          status: dbStatus,
          ready: true,
        },
        aiService: {
          status: 'HEALTHY',
          ready: true,
        },
        server: {
          acceptingTraffic: true,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }).catch(() => {
    return res.status(503).json({
      success: false,
      status: 'NOT_READY',
      message: 'AI microservice dependency not ready',
      dependencies: {
        database: {
          status: dbStatus,
          ready: true,
        },
        aiService: {
          status: 'OFFLINE',
          ready: false,
        },
        server: {
          acceptingTraffic: true,
        },
      },
      timestamp: new Date().toISOString(),
    });
  });
};

module.exports = {
  getHealthStatus,
  getReadinessStatus,
};
