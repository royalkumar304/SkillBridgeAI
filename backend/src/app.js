const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet());

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// API v1 Routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1/auth', authRoutes);

// Root route for quick verification
app.get('/', (req, res) => {
  res.json({
    project: 'SkillBridge AI REST API',
    version: '1.0.0',
    documentation: '/docs',
    healthCheck: '/api/v1/health',
  });
});

// 404 & Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
