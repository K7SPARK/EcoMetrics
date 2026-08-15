const express = require('express');
const router = express.Router();

// Mock database / API fetch helper for company analysis
// Replace this with your actual database queries or external API calls (e.g., Financial Modeling Prep, Alpha Vantage)
const fetchCompanyData = async (ticker) => {
  // Example dummy response - Replace with actual DB query or external API call
  return {
    symbol: ticker.toUpperCase(),
    companyName: `${ticker.toUpperCase()} Corp`,
    esgScore: 82,
    carbonFootprint: "12,400 MT",
    sustainabilityGrade: "A+",
    marketCap: "$1.2B"
  };
};

// Search route for live autocomplete / lookup
router.get('/search', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.json([]);
  }

  try {
    // Example: Search matching companies
    // If using MongoDB: const results = await Company.find({ name: new RegExp(query, 'i') }).limit(5);
    const mockResults = [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'TSLA', name: 'Tesla Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corp.' }
    ].filter(item => 
      item.symbol.toLowerCase().includes(query.toLowerCase()) || 
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    res.json(mockResults);
  } catch (err) {
    console.error('Company search error:', err);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// Route to render or return individual company analysis
router.get('/analyze/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const companyData = await fetchCompanyData(symbol);
    
    // Render an EJS view or return JSON based on requirement
    res.render('company/analysis', { company: companyData, user: req.session.user });
  } catch (err) {
    console.error('Analysis error:', err);
    res.status(500).send('Error loading company data');
  }
});

module.exports = router;