const express = require('express');
const router = express.Router();
const screenerController = require('../controllers/screenerController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/screener', ensureAuthenticated, screenerController.getScreener);

module.exports = router;