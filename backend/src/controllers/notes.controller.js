const axios = require('axios');
const Notes = require('../models/notes.model');
const Lecture = require('../models/lecture.model');
const Transcript = require('../models/transcript.model');
const Flashcard = require('../models/flashcard.model');
const MCQ = require('../models/mcq.model');
const { generateStudyPDF } = require('../services/pdf.service');

// @desc    Get all notes (filtered by lectureId if query parameter provided)
// @route   GET /notes
// @access  Private
const getNotes = async (req, res) => {
  try {
    const { lectureId } = req.query;
    let query = {};
    if (lectureId) {
      query.lectureId = lectureId;
    }

    const notes = await Notes.find(query);
    res.json({ success: true, count: notes.length, notes });
  } catch (error) {
    console.error('Get notes error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get notes by ID
// @route   GET /notes/:id
// @access  Private
const getNoteById = async (req, res) => {
  try {
    const note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Notes not found' });
    }

    res.json({ success: true, note });
  } catch (error) {
    console.error('Get note by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Notes not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update notes content (Teachers can edit notes)
// @route   PATCH /notes/:id
// @access  Private (Teacher, Admin)
const updateNotes = async (req, res) => {
  try {
    const { noteContent, topic } = req.body;
    let note = await Notes.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Notes not found' });
    }

    // Verify ownership via Lecture model
    const lecture = await Lecture.findById(note.lectureId);
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    if (req.user.role === 'teacher' && lecture.teacherId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to edit these notes' });
    }

    // Update fields
    if (noteContent) {
      note.noteContent = noteContent;
      // Invalidate existing cached translations since the source content changed
      note.translations = { bengali: '', hindi: '' };
    }
    if (topic) note.topic = topic;

    await note.save();

    res.json({ success: true, message: 'Notes updated successfully', note });
  } catch (error) {
    console.error('Update notes error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Translate notes to target language (Bengali or Hindi)
// @route   POST /notes/:id/translate
// @access  Private
const translateNotes = async (req, res) => {
  try {
    const { language } = req.body;
    if (!language || !['bengali', 'hindi'].includes(language.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid language (bengali or hindi)' });
    }

    const targetLang = language.toLowerCase();
    const note = await Notes.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ success: false, message: 'Notes not found' });
    }

    // Check if the translation is already cached in the database
    if (note.translations && note.translations[targetLang]) {
      console.log(`[Cache Hit] Returning stored ${targetLang} translation for notes ${req.params.id}`);
      return res.json({
        success: true,
        language: targetLang,
        translatedNotes: note.translations[targetLang]
      });
    }

    console.log(`[Cache Miss] Querying AI service to translate notes ${req.params.id} to ${targetLang}`);
    // Call FastAPI translate
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    const translateResponse = await axios.post(`${aiUrl}/translate`, {
      notes_content: note.noteContent,
      target_language: targetLang
    });

    const translatedNotes = translateResponse.data.translated_notes;

    // Save the new translation to cache
    if (!note.translations) {
      note.translations = { bengali: '', hindi: '' };
    }
    note.translations[targetLang] = translatedNotes;
    await note.save();

    res.json({
      success: true,
      language: targetLang,
      translatedNotes
    });
  } catch (error) {
    console.error('Translate notes error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Export notes, summaries, flashcards, MCQs as A4 PDF
// @route   GET /notes/lecture/:lectureId/pdf
// @access  Private
const exportLecturePDF = async (req, res) => {
  try {
    const { lectureId } = req.params;
    const { flashcards, mcqs, theme } = req.query; // 'true' | 'false', theme name

    const lecture = await Lecture.findById(lectureId).populate('teacherId', 'name email');
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    const notes = await Notes.findOne({ lectureId });

    // Performance optimization: Only query if requested in options
    const flashcardsData = (flashcards !== 'false') ? await Flashcard.find({ lectureId }) : [];
    const mcqsData = (mcqs !== 'false') ? await MCQ.find({ lectureId }) : [];

    // Set PDF headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=study_guide_${lectureId}.pdf`);

    // Stream PDF with user options
    generateStudyPDF({ 
      lecture, 
      notes, 
      flashcards: flashcardsData, 
      mcqs: mcqsData,
      options: { theme: theme || 'classic' }
    }, res);
  } catch (error) {
    console.error('PDF Export error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during PDF generation' });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  updateNotes,
  translateNotes,
  exportLecturePDF
};
