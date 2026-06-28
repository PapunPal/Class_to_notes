const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lecture title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio file is required']
  },
  duration: {
    type: Number,
    default: 0 // In seconds
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  steps: {
    transcription: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      error: { type: String, default: '' }
    },
    generation: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      error: { type: String, default: '' }
    }
  }
}, {
  timestamps: true
});

// Enable text search indexing
lectureSchema.index({ title: 'text', subject: 'text', description: 'text' });

module.exports = mongoose.model('Lecture', lectureSchema);
