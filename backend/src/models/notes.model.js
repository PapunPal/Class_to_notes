const mongoose = require('mongoose');

const notesSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true
  },
  noteContent: {
    type: String, // Markdown string
    required: true
  },
  summary: {
    short: { type: String, required: true },
    medium: { type: String, required: true },
    detailed: { type: String, required: true }
  },
  concepts: [
    {
      term: { type: String, required: true },
      definition: { type: String, required: true }
    }
  ],
  translations: {
    bengali: { type: String, default: '' },
    hindi: { type: String, default: '' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notes', notesSchema);
