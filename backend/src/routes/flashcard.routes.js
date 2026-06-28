const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getFlashcardsByLectureId } = require('../controllers/flashcard.controller');

// Get flashcards for a specific lecture
router.get('/:lectureId', protect, getFlashcardsByLectureId);

module.exports = router;
