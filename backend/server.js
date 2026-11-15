require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` SkillBridge AI Backend running on port ${PORT}`);
    console.log(` Environment : ${process.env.NODE_ENV || 'development'}`);
    console.log(` Health URL  : http://localhost:${PORT}/api/v1/health`);
    console.log(`===============================================`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down SkillBridge AI Backend...');
    server.close(() => {
      console.log('Backend process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

