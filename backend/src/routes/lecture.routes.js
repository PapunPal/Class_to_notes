const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  createLecture,
  getLectures,
  getLectureById,
  deleteLecture,
  semanticSearchLectures,
  retryLectureProcessing
} = require('../controllers/lecture.controller');

// Create lecture (requires audio file upload, teachers only)
router.post(
  '/',
  protect,
  requireRole(['teacher']),
  upload.single('audio'),
  createLecture
);

// Semantic search (students only)
router.get('/semantic-search', protect, requireRole(['student']), semanticSearchLectures);

// General lecture routes
router.get('/', protect, getLectures);
router.post('/:id/retry', protect, requireRole(['teacher']), retryLectureProcessing);
router.get('/:id', protect, getLectureById);
router.delete('/:id', protect, requireRole(['teacher', 'admin']), deleteLecture);

module.exports = router;
