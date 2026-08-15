const axios = require('axios');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const NodeCache = require('node-cache');

// Cache stock quotes for 5 minutes (300 seconds)
const marketCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_API_KEY;

async function getLivePriceYahoo(symbol) {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      price: quote.regularMarketPrice || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      peRatio: quote.trailingPE || 'N/A',
      source: 'Yahoo Finance'
    };
  } catch (error) {
    console.error(`Yahoo Finance error for ${symbol}:`, error.message);
    return null;
  }
}

async function getLivePriceAlphaVantage(symbol) {
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_KEY}`;
    const response = await axios.get(url);
    const data = response.data['Global Quote'];

    if (!data || Object.keys(data).length === 0) {
      throw new Error('No quote data found or rate limit hit');
    }

    return {
      price: parseFloat(data['05. price']),
      changePercent: parseFloat(data['10. change percent'].replace('%', '')),
      source: 'Alpha Vantage'
    };
  } catch (error) {
    console.error(`Alpha Vantage error for ${symbol}:`, error.message);
    return null;
  }
}

async function fetchRealTimeStockData(symbol) {
  const cacheKey = `stock_quote_${symbol.toUpperCase()}`;

  // 1. Return from Cache if available
  const cachedData = marketCache.get(cacheKey);
  if (cachedData) {
    return { ...cachedData, isCached: true };
  }

  // 2. Fetch fresh market data
  let freshData = await getLivePriceYahoo(symbol);
  if (!freshData) {
    freshData = await getLivePriceAlphaVantage(symbol);
  }

  // 3. Fallback defaults if all APIs fail
  if (!freshData) {
    return { price: 0, changePercent: 0, peRatio: 'N/A', source: 'Unavailable', isCached: false };
  }

  // 4. Save to Cache
  marketCache.set(cacheKey, freshData);
  return { ...freshData, isCached: false };
}

module.exports = { fetchRealTimeStockData };