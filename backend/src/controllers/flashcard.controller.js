const Flashcard = require('../models/flashcard.model');

// @desc    Get all flashcards for a specific lecture
// @route   GET /flashcards/:lectureId
// @access  Private
const getFlashcardsByLectureId = async (req, res) => {
  try {
    const flashcards = await Flashcard.find({ lectureId: req.params.lectureId });
    res.json({ success: true, count: flashcards.length, flashcards });
  } catch (error) {
    console.error('Get flashcards error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getFlashcardsByLectureId
};
