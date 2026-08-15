const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { forwardAuthenticated } = require('../middleware/authMiddleware');

router.get('/login', forwardAuthenticated, authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/signup', forwardAuthenticated, authController.getSignup);
router.post('/signup', authController.postSignup);
router.get('/logout', authController.logout);

module.exports = router;