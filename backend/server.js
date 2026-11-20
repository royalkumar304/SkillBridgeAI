require('dotenv').config();
const { validateJwtSecret } = require('./src/config/jwt');
const { validateCsrfSecret } = require('./src/config/csrf');
const { connectDB, closeDB, setShuttingDown } = require('./src/config/db');

// Strict Security Pre-flight: Fail-safe startup checks
try {
  // 1. Validate JWT configuration
  validateJwtSecret(process.env.JWT_SECRET);

  // 2. Validate CSRF configuration (requires dedicated secret >= 32 chars in production)
  validateCsrfSecret(process.env.CSRF_SIGNING_SECRET);

  // 3. Validate INTERNAL_SERVICE_KEY if configured or required in production
  const internalKey = process.env.INTERNAL_SERVICE_KEY;
  if (process.env.NODE_ENV === 'production') {
    if (!internalKey || internalKey.trim().length < 32) {
      throw new Error('[FATAL SECURITY CONFIGURATION] INTERNAL_SERVICE_KEY is required in production with at least 32 characters.');
    }
    if (!process.env.MONGO_URI || process.env.MONGO_URI.includes('127.0.0.1') || process.env.MONGO_URI.includes('localhost')) {
      throw new Error('[FATAL SECURITY CONFIGURATION] In production, an explicit, secure non-localhost MONGO_URI is required.');
    }
  }
} catch (configError) {
  console.error('\n******************************************************');
  console.error(' [SECURITY BLOCKER] Server Startup Aborted');
  console.error(` ${configError.message}`);
  console.error('******************************************************\n');
  process.exit(1);
}

const app = require('./src/app');

const PORT = process.env.PORT || 5001;
const SHUTDOWN_TIMEOUT_MS = parseInt(process.env.SHUTDOWN_TIMEOUT_MS, 10) || 10000;

let server = null;
let isShuttingDown = false;

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) {
    console.warn(`[Shutdown Warning] Received ${signal} while shutdown already in progress.`);
    return;
  }
  isShuttingDown = true;
  setShuttingDown(true);

  console.log(`\n[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  // Hard timeout guard against hung connections
  const forceExitTimer = setTimeout(() => {
    console.error(`[Shutdown Error] Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms. Forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExitTimer.unref();

  // 1. Stop accepting new HTTP requests
  if (server) {
    await new Promise((resolve) => {
      server.close((err) => {
        if (err) {
          console.error(`[Shutdown Error] Error closing HTTP server: ${err.message}`);
        } else {
          console.log('[Shutdown] HTTP server closed cleanly. No longer accepting traffic.');
        }
        resolve();
      });
    });
  }

  // 2. Close MongoDB connection cleanly
  await closeDB();

  console.log('[Shutdown] All dependencies cleaned up. Backend shutdown complete.');
  clearTimeout(forceExitTimer);
  process.exit(0);
};

// Establish Database Connection FIRST, then start listening
const startServer = async () => {
  try {
    console.log('[Startup] Connecting to MongoDB...');
    await connectDB();
    console.log('[Startup] MongoDB connected. Starting HTTP listener...');

    server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` SkillBridge AI Backend running on port ${PORT}`);
      console.log(` Environment   : ${process.env.NODE_ENV || 'development'}`);
      console.log(` Liveness URL  : http://localhost:${PORT}/api/v1/health`);
      console.log(` Readiness URL : http://localhost:${PORT}/api/v1/ready`);
      console.log(`===============================================`);
    });

    // Register process termination signal listeners
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('\n******************************************************');
    console.error(' [STARTUP FAILURE] MongoDB Connection Failed');
    console.error(' Server refuses to accept traffic in an unready state.');
    console.error(` Error: ${error.message || 'Database connection error'}`);
    console.error('******************************************************\n');
    process.exit(1);
  }
};

startServer();
