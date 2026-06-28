const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const {
  getNotes,
  getNoteById,
  updateNotes,
  translateNotes,
  exportLecturePDF
} = require('../controllers/notes.controller');

// Notes CRUD & translations
router.get('/', protect, getNotes);
router.get('/:id', protect, getNoteById);
router.patch('/:id', protect, requireRole(['teacher', 'admin']), updateNotes);
router.post('/:id/translate', protect, translateNotes);

// PDF export endpoint
router.get('/lecture/:lectureId/pdf', protect, exportLecturePDF);

module.exports = router;
