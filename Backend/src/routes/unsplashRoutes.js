const express = require('express');
const router = express.Router();
const { searchImages } = require('../controllers/unsplashController');
const { protect } = require('../middleware/auth');

router.get('/search', protect, searchImages);

module.exports = router;
