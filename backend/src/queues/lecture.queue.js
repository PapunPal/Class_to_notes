const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');

// Extract connection options
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connectionOpts = {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
};

// If using secure Redis (rediss://)
if (redisUrl.startsWith('rediss://')) {
  connectionOpts.tls = {
    rejectUnauthorized: false // Required for Upstash compatibility over TLS
  };
}

// Create reusable Redis connection instance
const redisConnection = new Redis(redisUrl, connectionOpts);

redisConnection.on('connect', () => {
  console.log('[Redis] Connected to queue database successfully.');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

// 1. Initialize the BullMQ Queue
const lectureQueue = new Queue('lecture-processing', { 
  connection: redisConnection 
});

// 2. Initialize the BullMQ Worker
const initLectureWorker = () => {
  // Import the background task handler
  const { processLectureInBackground } = require('../controllers/lecture.controller');

  const worker = new Worker('lecture-processing', async (job) => {
    const { lectureId, filePath, audioUrl } = job.data;
    const Lecture = require('../models/lecture.model');
    const { broadcastStatusChange } = require('../routes/sse.routes');

    const broadcastUpdate = async (status) => {
      try {
        const lec = await Lecture.findById(lectureId);
        broadcastStatusChange(lectureId, status, lec ? lec.steps : null);
      } catch (sseErr) {
        console.error('[SSE] Failed to broadcast status update:', sseErr.message);
      }
    };

    // Broadcast status update via SSE stream to notify client that processing/retry has started
    await broadcastUpdate('processing');
    
    try {
      await processLectureInBackground(lectureId, audioUrl || filePath);
      await broadcastUpdate('completed');
    } catch (err) {
      console.error(`[Worker] Job ${job.id} failed for lecture ${lectureId}:`, err.message);
      await broadcastUpdate('failed');
      throw err; // Propagate error so BullMQ registers failure and schedules retry
    }
  }, { 
    connection: redisConnection,
    concurrency: 2 // Allow processing up to 2 audio files simultaneously
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Global error:', err.message);
  });

  return worker;
};

module.exports = { 
  lectureQueue,
  initLectureWorker
};
