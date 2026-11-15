const { successResponse } = require('../utils/responseHelper');
const mongoose = require('mongoose');

const getHealthStatus = (req, res) => {
  const dbStateMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

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

module.exports = {
  getHealthStatus,
};

