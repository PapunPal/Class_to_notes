const mongoose = require('mongoose');

const transcriptSchema = new mongoose.Schema({
  lectureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true,
    index: true
  },
  rawTranscript: {
    type: String,
    required: true
  },
  cleanedTranscript: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transcript', transcriptSchema);
