const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
  key: String,
  rule: String,
  severity: String,
  component: String,
  project: String,
  status: String,
  message: String,
  effort: String,
  debt: String,
  author: String,
  tags: [String],
  creationDate: Date,
  updateDate: Date,
  type: String,
  scope: String,
  quickFixAvailable: Boolean,
  messageFormattings: Array,
  line: Number,
  textRange: {
    startLine: Number,
    endLine: Number
  },
  solutionHtml: String // para guardar la guía HTML
});

const analysisSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  issues: [issueSchema],
  issuesCount: Number
});

module.exports = mongoose.model('Analysis', analysisSchema);
