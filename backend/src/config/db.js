const mongoose = require('mongoose');

// State tracking for graceful shutdown and readiness
let isShuttingDown = false;
let isConnected = false;

// Setup Mongoose connection lifecycle listeners
const setupMongooseListeners = () => {
  mongoose.connection.on('connected', () => {
    isConnected = true;
    console.log('[Database] MongoDB connection established successfully.');
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    // Log safe error message without exposing connection strings or credentials
    console.error(`[Database Error] MongoDB connection error: ${err.message || 'Unknown database error'}`);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    console.warn('[Database Warning] MongoDB disconnected. Mongoose will attempt automatic reconnection.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    console.log('[Database] MongoDB reconnected successfully.');
  });
};

// Initialize listeners once
setupMongooseListeners();

/**
 * Connect to MongoDB with fail-fast semantics for startup.
 * @param {Object} options Override connection parameters (useful for isolated tests)
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async (options = {}) => {
  const uri = options.uri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillbridge_ai';
  const timeoutMs = options.serverSelectionTimeoutMS || parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 5000;

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs,
      connectTimeoutMS: timeoutMs,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE, 10) || 10,
    });
    isConnected = true;
    return conn;
  } catch (error) {
    isConnected = false;
    // Safe error message without logging credentials
    const safeMsg = error.message || 'Connection failure';
    console.error(`[Database Critical] Failed to connect to MongoDB at startup: ${safeMsg}`);
    throw error;
  }
};

/**
 * Close MongoDB connection cleanly during shutdown.
 * @param {boolean} force Force close without waiting for operations
 */
const closeDB = async (force = false) => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close(force);
      isConnected = false;
      console.log('[Database] MongoDB connection cleanly closed.');
    } catch (err) {
      console.error(`[Database Error] Error closing MongoDB connection: ${err.message}`);
    }
  }
};

/**
 * Returns current database readiness state.
 */
const isDbReady = () => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  return !isShuttingDown && mongoose.connection.readyState === 1;
};

/**
 * Marks application as shutting down.
 */
const setShuttingDown = (status = true) => {
  isShuttingDown = status;
};

const getShuttingDownStatus = () => isShuttingDown;

module.exports = {
  connectDB,
  closeDB,
  isDbReady,
  setShuttingDown,
  getShuttingDownStatus,
};
