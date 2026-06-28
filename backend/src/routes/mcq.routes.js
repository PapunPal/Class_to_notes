const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getMCQsByLectureId } = require('../controllers/mcq.controller');

// Get MCQs for a specific lecture
router.get('/:lectureId', protect, getMCQsByLectureId);

module.exports = router;
