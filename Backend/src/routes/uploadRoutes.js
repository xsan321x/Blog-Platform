const express = require('express');
const router = express.Router();
const { uploadImage, uploadAvatar } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Upload cover image for post
router.post('/image', protect, upload.single('image'), uploadImage);

// Upload user avatar
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

module.exports = router;
