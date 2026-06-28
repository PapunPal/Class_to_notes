const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

// In-memory registry of active client connections (Express response objects)
let clients = [];

// Helper to broadcast status changes to all active clients
const broadcastStatusChange = (lectureId, status, steps = null) => {
  const payload = JSON.stringify({ lectureId, status, steps });

  clients.forEach(client => {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (err) {
      console.error('[SSE] Failed to write to client response:', err.message);
    }
  });
};

// SSE stream connection endpoint
router.get('/status-stream', protect, (req, res) => {
  // Set headers for SSE event stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  // Add the response object to our active registry
  clients.push(res);

  // Ping client periodically to prevent connection timeouts (keep-alive)
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n'); // Comment syntax in SSE used as a ping
    } catch (e) {}
  }, 30000);

  // Clean up connection when client disconnects
  req.on('close', () => {
    clearInterval(pingInterval);
    clients = clients.filter(client => client !== res);
  });
});

module.exports = {
  router,
  broadcastStatusChange
};
