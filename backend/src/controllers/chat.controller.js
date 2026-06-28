const axios = require('axios');
const Chat = require('../models/chat.model');
const Transcript = require('../models/transcript.model');

// @desc    Chat with classroom notes (RAG Chat Assistant)
// @route   POST /chat
// @access  Private (Student)
const chatWithNotes = async (req, res) => {
  try {
    const { lectureId, question } = req.body;

    if (!lectureId || !question) {
      return res.status(400).json({ success: false, message: 'Please provide lectureId and question' });
    }

    // Get lecture transcript content
    const transcript = await Transcript.findOne({ lectureId });
    if (!transcript) {
      return res.status(404).json({ success: false, message: 'Lecture transcript not found. Check if processing is complete.' });
    }

    // Retrieve last 10 exchanges for chat history context
    const historyDocs = await Chat.find({
      studentId: req.user._id,
      lectureId
    }).sort({ createdAt: 1 }).limit(10);

    const chatHistory = historyDocs.map(h => ({
      question: h.question,
      answer: h.answer
    }));

    // Call FastAPI chat endpoint
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const chatResponse = await axios.post(`${aiUrl}/chat`, {
      lecture_content: transcript.cleanedTranscript,
      chat_history: chatHistory,
      question: question
    });

    const { answer } = chatResponse.data;

    // Save chat exchange to MongoDB
    const chatRecord = await Chat.create({
      studentId: req.user._id,
      lectureId,
      question,
      answer
    });

    res.json({
      success: true,
      chatRecord
    });

  } catch (error) {
    console.error('Chat with notes error:', error.message);
    if (error.response) {
      console.error('FastAPI error response:', error.response.data);
    }
    res.status(500).json({ success: false, message: 'Server error during chat query' });
  }
};

module.exports = {
  chatWithNotes
};
