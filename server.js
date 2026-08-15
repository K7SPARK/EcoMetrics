const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();

// 1. Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecometrics';

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB Connected: 127.0.0.1'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// 2. Middleware & Views
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 3. Session Setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecometrics_secret_key',
  resave: false,
  saveUninitialized: false,
  store: (MongoStore.create ? MongoStore : MongoStore.default).create({
    mongoUrl: MONGO_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

// 4. Master Data Structured for compare.ejs & analysis.ejs
const fallbackCompanies = [
  {
    ticker: 'AAPL',
    symbol: 'AAPL',
    name: 'Apple Inc.',
    companyName: 'Apple Inc.',
    industry: 'Technology',
    marketCap: '$2.95T',
    price: '$180.20',
    livePrice: 180.20,
    esgScore: 88,
    environmentalScore: 85,
    socialScore: 90,
    governanceScore: 89,
    carbonFootprint: '10.2k MT CO2e',
    sustainabilityGrade: 'A+',
    esgMetrics: { totalScore: 88, envScore: 85, socialScore: 90, govScore: 89 }
  },
  {
    ticker: 'MSFT',
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    companyName: 'Microsoft Corp.',
    industry: 'Software & Cloud',
    marketCap: '$3.10T',
    price: '$415.50',
    livePrice: 415.50,
    esgScore: 92,
    environmentalScore: 94,
    socialScore: 89,
    governanceScore: 93,
    carbonFootprint: '8.1k MT CO2e',
    sustainabilityGrade: 'A++',
    esgMetrics: { totalScore: 92, envScore: 94, socialScore: 89, govScore: 93 }
  },
  {
    ticker: 'TSLA',
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    companyName: 'Tesla Inc.',
    industry: 'Automotive',
    marketCap: '$750.0B',
    price: '$240.10',
    livePrice: 240.10,
    esgScore: 79,
    environmentalScore: 88,
    socialScore: 70,
    governanceScore: 79,
    carbonFootprint: '18.5k MT CO2e',
    sustainabilityGrade: 'A',
    esgMetrics: { totalScore: 79, envScore: 88, socialScore: 70, govScore: 79 }
  },
  {
    ticker: 'RELIANCE',
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    companyName: 'Reliance Industries Ltd.',
    industry: 'Conglomerate',
    marketCap: '$230.0B',
    price: '$2950.00',
    livePrice: 2950.00,
    esgScore: 74,
    environmentalScore: 70,
    socialScore: 76,
    governanceScore: 76,
    carbonFootprint: '45.0k MT CO2e',
    sustainabilityGrade: 'B+',
    esgMetrics: { totalScore: 74, envScore: 70, socialScore: 76, govScore: 76 }
  },
  {
    ticker: 'INFY',
    symbol: 'INFY',
    name: 'Infosys Limited',
    companyName: 'Infosys Limited',
    industry: 'IT Services',
    marketCap: '$78.0B',
    price: '$18.50',
    livePrice: 18.50,
    esgScore: 85,
    environmentalScore: 82,
    socialScore: 86,
    governanceScore: 87,
    carbonFootprint: '12.0k MT CO2e',
    sustainabilityGrade: 'A',
    esgMetrics: { totalScore: 85, envScore: 82, socialScore: 86, govScore: 87 }
  },
  {
    ticker: 'DELOITTE',
    symbol: 'DELOITTE',
    name: 'Deloitte Touche Tohmatsu Ltd.',
    companyName: 'Deloitte Touche Tohmatsu Ltd.',
    industry: 'Professional Services',
    marketCap: 'Private',
    price: 'N/A',
    livePrice: 0.00,
    esgScore: 81,
    environmentalScore: 80,
    socialScore: 82,
    governanceScore: 81,
    carbonFootprint: '14.2k MT CO2e',
    sustainabilityGrade: 'A',
    esgMetrics: { totalScore: 81, envScore: 80, socialScore: 82, govScore: 81 }
  }
];

// Helper to provide default array structure if needed by views
const defaultInsights = [
  'Strong environmental compliance across global operations.',
  'Targeting 100% renewable supply chain transition.',
  'High governance board oversight and audit safety.'
];

// 5. Auth Controller Routes
const authController = require('./controllers/authController');
app.get('/login', authController.getLogin);
app.get('/signup', authController.getSignup);
app.post('/signup', authController.postSignup);
app.post('/login', authController.postLogin);
app.get('/logout', authController.logout);

// 6. Navigation Routes
app.get('/', (req, res) => res.redirect('/screener'));

app.get('/screener', isAuthenticated, (req, res) => {
  res.render('screener', { activeTab: 'screener', user: req.session.user });
});

// Compare Route with all properties required by compare.ejs
app.get('/compare', isAuthenticated, (req, res) => {
  const ticker1 = (req.query.ticker1 || 'AAPL').toUpperCase();
  const ticker2 = (req.query.ticker2 || 'MSFT').toUpperCase();

  const comp1 = fallbackCompanies.find(c => c.ticker === ticker1) || fallbackCompanies[0];
  const comp2 = fallbackCompanies.find(c => c.ticker === ticker2) || fallbackCompanies[1];

  res.render('compare', {
    activeTab: 'compare',
    allCompanies: fallbackCompanies,
    comp1: comp1,
    comp2: comp2,
    comp1Insights: comp1.insights || defaultInsights,
    comp2Insights: comp2.insights || defaultInsights,
    user: req.session.user
  });
});

app.get('/analysis', isAuthenticated, (req, res) => {
  res.redirect('/company/AAPL');
});

// 7. Search API Endpoint
const FMP_API_KEY = process.env.FMP_API_KEY || '';

app.get('/api/companies/search', isAuthenticated, async (req, res) => {
  const query = (req.query.query || '').trim().toLowerCase();
  if (!query) return res.json([]);

  try {
    if (FMP_API_KEY && FMP_API_KEY !== 'demo') {
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/search?query=${encodeURIComponent(query)}&limit=8&apikey=${FMP_API_KEY}`
      );
      if (response.data && response.data.length > 0) {
        const companies = response.data.map((comp) => ({
          symbol: comp.symbol,
          ticker: comp.symbol,
          name: comp.name || comp.symbol,
          exchange: comp.stockExchange || 'Global'
        }));
        return res.json(companies);
      }
    }
  } catch (error) {
    // Fallback to local
  }

  let matches = fallbackCompanies.filter(c => 
    c.symbol.toLowerCase().includes(query) || 
    c.name.toLowerCase().includes(query)
  ).map(c => ({ symbol: c.symbol, ticker: c.ticker, name: c.name, exchange: 'Global' }));

  if (matches.length === 0 && query.length >= 2) {
    matches.push({
      symbol: query.toUpperCase(),
      ticker: query.toUpperCase(),
      name: query.charAt(0).toUpperCase() + query.slice(1),
      exchange: 'Global / Private'
    });
  }

  res.json(matches);
});

// 8. Dynamic Company Page Analysis Route
app.get('/company/:symbol', isAuthenticated, async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  let profile = null;

  try {
    if (FMP_API_KEY && FMP_API_KEY !== 'demo') {
      const response = await axios.get(
        `https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`
      );
      if (response.data && response.data[0]) {
        profile = response.data[0];
      }
    }
  } catch (error) {
    // API fail fallback
  }

  const matchedFallback = fallbackCompanies.find(c => c.symbol === symbol);

  const companyData = {
    symbol: symbol,
    ticker: symbol,
    livePrice: profile && profile.price ? profile.price : (matchedFallback ? matchedFallback.livePrice : 150.00),
    companyName: profile ? profile.companyName : (matchedFallback ? matchedFallback.name : symbol),
    industry: profile ? profile.industry : (matchedFallback ? matchedFallback.industry : 'Corporate Enterprise'),
    sector: profile ? profile.sector : 'Global Operations',
    marketCap: profile && profile.mktCap ? `$${(profile.mktCap / 1e9).toFixed(2)}B` : (matchedFallback ? matchedFallback.marketCap : 'N/A'),
    price: profile && profile.price ? `$${profile.price}` : (matchedFallback ? matchedFallback.price : 'N/A'),
    description: profile ? profile.description : `ESG analysis profile for ${matchedFallback ? matchedFallback.name : symbol}.`,
    esgScore: matchedFallback ? matchedFallback.esgScore : 82,
    environmentalScore: matchedFallback ? matchedFallback.environmentalScore : 80,
    socialScore: matchedFallback ? matchedFallback.socialScore : 82,
    governanceScore: matchedFallback ? matchedFallback.governanceScore : 84,
    carbonFootprint: matchedFallback ? matchedFallback.carbonFootprint : '14.5k MT CO2e',
    sustainabilityGrade: matchedFallback ? matchedFallback.sustainabilityGrade : 'A',
    esgMetrics: matchedFallback ? matchedFallback.esgMetrics : { totalScore: 82, envScore: 80, socialScore: 82, govScore: 84 }
  };

  res.render('company/analysis', { company: companyData, activeTab: 'analysis', user: req.session.user }, (err, html) => {
    if (err) {
      return res.render('analysis', { company: companyData, activeTab: 'analysis', user: req.session.user });
    }
    res.send(html);
  });
});

// 9. Server Initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`EcoMetrics platform running on http://localhost:${PORT}`));