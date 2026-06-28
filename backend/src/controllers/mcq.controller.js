const MCQ = require('../models/mcq.model');

// @desc    Get all MCQs for a specific lecture
// @route   GET /mcqs/:lectureId
// @access  Private
const getMCQsByLectureId = async (req, res) => {
  try {
    const mcqs = await MCQ.find({ lectureId: req.params.lectureId });
    res.json({ success: true, count: mcqs.length, mcqs });
  } catch (error) {
    console.error('Get MCQs error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMCQsByLectureId
};
