require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { initLectureWorker } = require('./queues/lecture.queue');

// Connect to Database
connectDB();

// Initialize BullMQ Background Task Worker
initLectureWorker();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Express server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
