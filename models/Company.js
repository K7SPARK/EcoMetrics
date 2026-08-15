const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  ticker: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  sector: { type: String, required: true },
  peRatio: { type: Number, default: 0 },
  profitMargin: { type: Number, default: 0 },
  esgMetrics: {
    totalScore: { type: Number, required: true },
    environmentalScore: { type: Number, required: true },
    socialScore: { type: Number, required: true },
    governanceScore: { type: Number, required: true },
    carbonIntensity: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);