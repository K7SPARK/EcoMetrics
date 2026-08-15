const express = require('express');
const router = express.Router();
const compareController = require('../controllers/compareController');
const { ensureAuthenticated } = require('../middleware/authMiddleware');

router.get('/compare', ensureAuthenticated, compareController.getCompare);

module.exports = router;