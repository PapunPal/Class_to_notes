const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { chatWithNotes } = require('../controllers/chat.controller');

// Chat with notes (students only)
router.post('/', protect, requireRole(['student']), chatWithNotes);

module.exports = router;
