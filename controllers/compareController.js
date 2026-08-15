const Company = require('../models/Company');
const { fetchRealTimeStockData } = require('../services/marketData');

function analyzeCompany(comp) {
  const insights = [];
  if (comp.profitMargin > 20 && comp.esgMetrics.totalScore < 50) {
    insights.push({ type: 'DANGER', text: 'High profitability masked by low ESG score. Regulatory liability risk.' });
  }
  if (comp.esgMetrics.environmentalScore > 80) {
    insights.push({ type: 'SUCCESS', text: 'Top-tier Environmental Compliance. Low carbon footprint.' });
  }
  if (comp.esgMetrics.governanceScore < 50) {
    insights.push({ type: 'WARNING', text: 'Governance concerns detected. Audit board independence.' });
  }
  return insights;
}

exports.getCompare = async (req, res) => {
  try {
    const allCompanies = await Company.find().lean();
    const ticker1 = (req.query.ticker1 || allCompanies[0]?.ticker || 'MSFT').toUpperCase();
    const ticker2 = (req.query.ticker2 || allCompanies[1]?.ticker || 'XOM').toUpperCase();

    const raw1 = allCompanies.find(c => c.ticker === ticker1) || allCompanies[0];
    const raw2 = allCompanies.find(c => c.ticker === ticker2) || allCompanies[1];

    const live1 = await fetchRealTimeStockData(raw1.ticker);
    const live2 = await fetchRealTimeStockData(raw2.ticker);

    const comp1 = { ...raw1, livePrice: live1.price, priceChange: live1.changePercent };
    const comp2 = { ...raw2, livePrice: live2.price, priceChange: live2.changePercent };

    res.render('compare', {
      comp1,
      comp2,
      comp1Insights: analyzeCompany(comp1),
      comp2Insights: analyzeCompany(comp2),
      allCompanies,
      user: req.session.user
    });
  } catch (error) {
    res.status(500).send('Error performing asset comparison');
  }
};