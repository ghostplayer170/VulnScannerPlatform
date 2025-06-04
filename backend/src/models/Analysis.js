const mongoose = require('mongoose');

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
  metrics: {
    bugs: Number,
    vulnerabilities: Number,
    code_smells: Number,
    security_rating: String,
    reliability_rating: String
  },
  issuesCount: Number,
  sonarAnalysisId: String,
  dashboardUrl: String
});

module.exports = mongoose.model('Analysis', analysisSchema);
