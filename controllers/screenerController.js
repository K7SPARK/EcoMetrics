const Company = require('../models/Company');
const { fetchRealTimeStockData } = require('../services/marketData');

exports.getScreener = async (req, res) => {
  try {
    const { minEsg, minEnv, minSoc, minGov, maxPe, minProfit, sector, sortBy } = req.query;

    let query = {};
    if (minEsg) query['esgMetrics.totalScore'] = { $gte: Number(minEsg) };
    if (minEnv) query['esgMetrics.environmentalScore'] = { $gte: Number(minEnv) };
    if (minSoc) query['esgMetrics.socialScore'] = { $gte: Number(minSoc) };
    if (minGov) query['esgMetrics.governanceScore'] = { $gte: Number(minGov) };
    if (minProfit) query.profitMargin = { $gte: Number(minProfit) };
    if (maxPe) query.peRatio = { $lte: Number(maxPe) };
    if (sector && sector !== 'ALL') query.sector = sector;

    let companies = await Company.find(query).lean();

    const enrichedCompanies = await Promise.all(
      companies.map(async (company) => {
        const liveMarket = await fetchRealTimeStockData(company.ticker);
        return {
          ...company,
          livePrice: liveMarket.price,
          priceChange: liveMarket.changePercent,
          peRatio: liveMarket.peRatio !== 'N/A' ? liveMarket.peRatio : company.peRatio,
          dataSource: liveMarket.source,
          isCached: liveMarket.isCached
        };
      })
    );

    if (sortBy === 'ESG_DESC') enrichedCompanies.sort((a, b) => b.esgMetrics.totalScore - a.esgMetrics.totalScore);
    if (sortBy === 'PROFIT_DESC') enrichedCompanies.sort((a, b) => b.profitMargin - a.profitMargin);
    if (sortBy === 'PE_ASC') enrichedCompanies.sort((a, b) => (parseFloat(a.peRatio) || 999) - (parseFloat(b.peRatio) || 999));

    const sectors = await Company.distinct('sector');

    res.render('screener', {
      companies: enrichedCompanies,
      sectors,
      filters: req.query,
      user: req.session.user
    });
  } catch (error) {
    console.error('Screener Engine Error:', error);
    res.status(500).send('Error running stock screener query');
  }
};