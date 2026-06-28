const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const Lecture = require('../models/lecture.model');
const Transcript = require('../models/transcript.model');
const Notes = require('../models/notes.model');
const Flashcard = require('../models/flashcard.model');
const MCQ = require('../models/mcq.model');
const { lectureQueue } = require('../queues/lecture.queue');
const cloudinary = require('../config/cloudinary');

// Background processor to handle AI generation
const processLectureInBackground = async (lectureId, fileIdentifier) => {
  const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  const { broadcastStatusChange } = require('../routes/sse.routes');
  
  try {
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      console.error(`[Worker] Lecture ${lectureId} not found.`);
      return;
    }

    // Ensure database status is processing (especially important for retry attempts)
    lecture.status = 'processing';
    await lecture.save();

    let raw_transcript = '';
    let cleaned_transcript = '';
    let subject = '';
    let topic = '';
    let subtopics = [];

    // Step 1: AI Transcription
    if (lecture.steps?.transcription?.status === 'completed') {
      console.log(`[Worker] Transcription step already completed. Skipping transcription for lecture ${lectureId}`);
      // Find the existing transcript in the database
      const existingTranscript = await Transcript.findOne({ lectureId });
      if (existingTranscript) {
        raw_transcript = existingTranscript.rawTranscript;
        cleaned_transcript = existingTranscript.cleanedTranscript;
        topic = lecture.title;
      } else {
        console.warn(`[Worker] Transcription status was marked completed but no Transcript document found. Re-transcribing.`);
        lecture.steps.transcription.status = 'processing';
        lecture.steps.transcription.error = '';
        await lecture.save();
      }
    }

    if (!cleaned_transcript) {
      lecture.steps.transcription.status = 'processing';
      lecture.steps.transcription.error = '';
      await lecture.save();
      broadcastStatusChange(lectureId, 'processing', lecture.steps);

      // Prepare audio stream (download from Cloudinary if it is a web URL, or read locally)
      const formData = new FormData();
      
      if (fileIdentifier.startsWith('http://') || fileIdentifier.startsWith('https://')) {
        console.log(`[Worker] Passing remote audio URL to AI Service: ${fileIdentifier}`);
        formData.append('audio_url', fileIdentifier);
      } else {
        console.log(`[Worker] Reading audio file from local path: ${fileIdentifier}`);
        formData.append('file', fs.createReadStream(fileIdentifier));
      }

      try {
        const transResponse = await axios.post(`${aiUrl}/transcribe`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        ({ raw_transcript, cleaned_transcript, subject, topic, subtopics } = transResponse.data);

        // Delete any existing transcript to avoid duplicate entries
        await Transcript.deleteMany({ lectureId });

        // Save Transcript model
        await Transcript.create({
          lectureId,
          rawTranscript: raw_transcript,
          cleanedTranscript: cleaned_transcript
        });

        // Update Lecture with detected topic/subject
        if (subject && subject !== 'General') {
          lecture.subject = subject;
        }
        lecture.title = topic || lecture.title;
        if (subtopics && subtopics.length > 0) {
          const subtopicsStr = `Topics covered: ${subtopics.join(', ')}`;
          if (!lecture.description.includes(subtopicsStr)) {
            lecture.description = `${lecture.description}\n\n${subtopicsStr}`.trim();
          }
        }

        lecture.steps.transcription.status = 'completed';
        lecture.steps.transcription.error = '';
        await lecture.save();
        broadcastStatusChange(lectureId, 'processing', lecture.steps);
      } catch (transErr) {
        lecture.steps.transcription.status = 'failed';
        lecture.steps.transcription.error = transErr.message || 'Transcription API failed';
        lecture.status = 'failed';
        await lecture.save();
        broadcastStatusChange(lectureId, 'failed', lecture.steps);
        throw transErr;
      }
    }

    // Step 2: Study Materials Generation
    if (lecture.steps?.generation?.status !== 'completed') {
      lecture.steps.generation.status = 'processing';
      lecture.steps.generation.error = '';
      await lecture.save();
      broadcastStatusChange(lectureId, 'processing', lecture.steps);

      try {
        // Call FastAPI to generate study materials (Notes, summaries, flashcards, MCQs)
        const materialsResponse = await axios.post(`${aiUrl}/generate-study-materials`, {
          cleaned_transcript
        });

        const { notes, summaries, concepts, flashcards, mcqs } = materialsResponse.data;

        // Clear any previously generated materials for this lecture
        await Notes.deleteMany({ lectureId });
        await Flashcard.deleteMany({ lectureId });
        await MCQ.deleteMany({ lectureId });

        // Save Notes model
        await Notes.create({
          lectureId,
          topic: topic || lecture.title,
          noteContent: notes,
          summary: {
            short: summaries.short || 'No short summary generated.',
            medium: summaries.medium || 'No medium summary generated.',
            detailed: summaries.detailed || 'No detailed summary generated.'
          },
          concepts: concepts || []
        });

        // Save Flashcards
        if (flashcards && flashcards.length > 0) {
          const flashcardDocs = flashcards.map(fc => ({
            lectureId,
            question: fc.question,
            answer: fc.answer
          }));
          await Flashcard.insertMany(flashcardDocs);
        }

        // Save MCQs
        if (mcqs && mcqs.length > 0) {
          const mcqDocs = mcqs.map(mcq => ({
            lectureId,
            question: mcq.question,
            options: mcq.options,
            correctAnswer: mcq.correctAnswer,
            explanation: mcq.explanation
          }));
          await MCQ.insertMany(mcqDocs);
        }

        lecture.steps.generation.status = 'completed';
        lecture.steps.generation.error = '';
        lecture.status = 'completed';
        await lecture.save();
        broadcastStatusChange(lectureId, 'completed', lecture.steps);
      } catch (genErr) {
        lecture.steps.generation.status = 'failed';
        lecture.steps.generation.error = genErr.message || 'Study material generation failed';
        lecture.status = 'failed';
        await lecture.save();
        broadcastStatusChange(lectureId, 'failed', lecture.steps);
        throw genErr;
      }
    } else {
      lecture.status = 'completed';
      await lecture.save();
      broadcastStatusChange(lectureId, 'completed', lecture.steps);
    }

  } catch (error) {
    console.error(`Error in background processing for lecture ${lectureId}:`, error.message);
    if (error.response) {
      console.error('FastAPI Error response:', error.response.data);
    }
    
    // Mark lecture failed if any step remains uncompleted
    try {
      const lec = await Lecture.findById(lectureId);
      if (lec && lec.status !== 'completed') {
        lec.status = 'failed';
        await lec.save();
        broadcastStatusChange(lectureId, 'failed', lec.steps);
      }
    } catch (dbErr) {
      console.error('Failed to update lecture status to failed in DB:', dbErr.message);
    }
    throw error;
  }
};

// @desc    Create a new lecture (Upload audio)
// @route   POST /lectures
// @access  Private (Teacher)
const createLecture = async (req, res) => {
  try {
    const { title, description, subject } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an audio file' });
    }

    if (!title || !subject) {
      // Clean file from disk
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Title and subject are required' });
    }

    console.log(`[Cloudinary] Starting upload of temp file: ${req.file.path}`);
    
    // Upload local Multer temp file directly to Cloudinary (under 'video' category for audio formats)
    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'classroom_notes_lectures'
    });
    
    const audioUrl = uploadResult.secure_url;
    console.log(`[Cloudinary] Upload complete. Secure URL: ${audioUrl}`);

    // Clean up local temp file from disk immediately
    try {
      fs.unlinkSync(req.file.path);
      console.log(`[Cloudinary] Cleared local temp upload: ${req.file.path}`);
    } catch (e) {
      console.error('Failed to unlink local temp file:', e.message);
    }

    // Create Lecture with remote Cloudinary URL
    const lecture = await Lecture.create({
      title,
      description: description || '',
      subject,
      teacherId: req.user._id,
      audioUrl,
      duration: 0, // In seconds (can be computed or defaulted)
      status: 'processing'
    });

    // Add processing job to Redis task queue using Cloudinary URL
    await lectureQueue.add('processLecture', {
      lectureId: lecture._id,
      audioUrl: audioUrl
    }, {
      attempts: 1,
      backoff: 5000
    });

    res.status(201).json({
      success: true,
      message: 'Lecture upload successful. Processing started in the background.',
      lecture
    });
  } catch (error) {
    console.error('Create lecture error:', error.message);
    // Cleanup file if uploaded and not cleared yet
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all lectures
// @route   GET /lectures
// @access  Private (Student, Teacher, Admin)
const getLectures = async (req, res) => {
  try {
    let query = {};
    
    // Filter by subject if provided
    if (req.query.subject) {
      query.subject = req.query.subject;
    }

    // Text search if query param provided (MongoDB Text Index)
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Teachers only see their own lectures (unless viewing as student)
    // For general retrieval:
    if (req.user.role === 'teacher' && req.query.own === 'true') {
      query.teacherId = req.user._id;
    }

    // Students only see completed lectures
    if (req.user.role === 'student') {
      query.status = 'completed';
    }

    const lectures = await Lecture.find(query)
      .populate('teacherId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: lectures.length, lectures });
  } catch (error) {
    console.error('Get lectures error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get lecture by ID
// @route   GET /lectures/:id
// @access  Private
const getLectureById = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id)
      .populate('teacherId', 'name email avatar');

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    // Student access protection
    if (req.user.role === 'student' && lecture.status !== 'completed') {
      return res.status(403).json({ success: false, message: 'Lecture study materials are still processing' });
    }

    res.json({ success: true, lecture });
  } catch (error) {
    console.error('Get lecture by ID error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete lecture
// @route   DELETE /lectures/:id
// @access  Private (Teacher, Admin)
const deleteLecture = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    // Check ownership (Teachers can only delete their own lectures, Admins can delete anything)
    if (req.user.role === 'teacher' && lecture.teacherId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to delete this lecture' });
    }

    // Delete associated file (cloud or local fallback)
    if (lecture.audioUrl.startsWith('http://') || lecture.audioUrl.startsWith('https://')) {
      try {
        // Extract public_id from Cloudinary URL (e.g. folder/filename without extension)
        const urlParts = lecture.audioUrl.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const filename = path.parse(filenameWithExt).name;
        const publicId = `${folder}/${filename}`;
        
        console.log(`[Cloudinary] Deleting remote resource: ${publicId}`);
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      } catch (cloudErr) {
        console.error('Failed to delete resource from Cloudinary:', cloudErr.message);
      }
    } else {
      // Legacy local file cleanup
      const audioFilename = path.basename(lecture.audioUrl);
      const audioFilePath = path.join(__dirname, '../../uploads', audioFilename);
      if (fs.existsSync(audioFilePath)) {
        fs.unlinkSync(audioFilePath);
      }
    }

    // Delete models referencing this lecture
    await Lecture.findByIdAndDelete(req.params.id);
    await Transcript.deleteMany({ lectureId: req.params.id });
    await Notes.deleteMany({ lectureId: req.params.id });
    await Flashcard.deleteMany({ lectureId: req.params.id });
    await MCQ.deleteMany({ lectureId: req.params.id });

    res.json({ success: true, message: 'Lecture and all generated study materials deleted successfully' });
  } catch (error) {
    console.error('Delete lecture error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Perform semantic search on lectures
// @route   GET /lectures/semantic-search
// @access  Private (Student)
const semanticSearchLectures = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Please provide a search query' });
    }

    // Get all completed lectures
    const lectures = await Lecture.find({ status: 'completed' })
      .populate('teacherId', 'name email avatar');

    if (lectures.length === 0) {
      return res.json({ success: true, count: 0, lectures: [] });
    }

    // Prepare items for FastAPI
    // Format text field using title and description
    const searchItems = lectures.map(l => ({
      id: l._id.toString(),
      text: `${l.title} ${l.subject} ${l.description}`
    }));

    // Call FastAPI /semantic-search
    const aiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    const searchResponse = await axios.post(`${aiUrl}/semantic-search`, {
      query: q,
      items: searchItems
    });

    const rankedResults = searchResponse.data.results;
    
    // Reorder mongoose lectures list based on the ranked results
    const rankedLectures = [];
    rankedResults.forEach(rankedItem => {
      const match = lectures.find(l => l._id.toString() === rankedItem.id);
      if (match) {
        rankedLectures.push(match);
      }
    });

    res.json({ success: true, count: rankedLectures.length, lectures: rankedLectures });

  } catch (error) {
    console.error('Semantic search lectures error:', error.message);
    // Fallback to normal text search
    try {
      const fallbackLectures = await Lecture.find({
        status: 'completed',
        $text: { $search: req.query.q }
      }).populate('teacherId', 'name email');
      res.json({ success: true, count: fallbackLectures.length, lectures: fallbackLectures, fallback: true });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// @desc    Retry failed lecture processing
// @route   POST /lectures/:id/retry
// @access  Private (Teacher)
const retryLectureProcessing = async (req, res) => {
  try {
    const lecture = await Lecture.findById(req.params.id);

    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Lecture not found' });
    }

    // Check ownership
    if (req.user.role === 'teacher' && lecture.teacherId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized to retry this lecture' });
    }

    // Set status to processing and reset failed steps
    lecture.status = 'processing';
    if (lecture.steps) {
      if (lecture.steps.transcription.status === 'failed') {
        lecture.steps.transcription.status = 'pending';
        lecture.steps.transcription.error = '';
      }
      if (lecture.steps.generation.status === 'failed') {
        lecture.steps.generation.status = 'pending';
        lecture.steps.generation.error = '';
      }
    }
    await lecture.save();

    // Check if the URL is a cloud URL or local
    if (lecture.audioUrl.startsWith('http://') || lecture.audioUrl.startsWith('https://')) {
      // Add retry processing job to Redis task queue using Cloudinary URL
      await lectureQueue.add('processLecture', {
        lectureId: lecture._id,
        audioUrl: lecture.audioUrl
      }, {
        attempts: 1,
        backoff: 5000
      });
    } else {
      // Determine local audio file path (legacy support)
      const audioFilename = path.basename(lecture.audioUrl);
      const audioFilePath = path.join(__dirname, '../../uploads', audioFilename);

      if (!fs.existsSync(audioFilePath)) {
        lecture.status = 'failed';
        await lecture.save();
        return res.status(400).json({ success: false, message: 'Original audio file no longer exists on server disk.' });
      }

      // Add retry processing job to Redis task queue using local path
      await lectureQueue.add('processLecture', {
        lectureId: lecture._id,
        filePath: audioFilePath
      }, {
        attempts: 1,
        backoff: 5000
      });
    }

    res.json({
      success: true,
      message: 'Lecture processing restarted successfully in the background.',
      lecture
    });
  } catch (error) {
    console.error('Retry processing error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createLecture,
  getLectures,
  getLectureById,
  deleteLecture,
  semanticSearchLectures,
  retryLectureProcessing,
  processLectureInBackground
};
