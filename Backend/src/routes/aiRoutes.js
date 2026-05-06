const express = require('express');
const router = express.Router();
const { generateContent, improveWriting, suggestHeadings } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { requireAuthor } = require('../middleware/rbac');

// All AI routes require author role or higher
router.post('/generate', protect, requireAuthor, generateContent);
router.post('/improve', protect, requireAuthor, improveWriting);
router.post('/suggest-headings', protect, requireAuthor, suggestHeadings);

module.exports = router;
