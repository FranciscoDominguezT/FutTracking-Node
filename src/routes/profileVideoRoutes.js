const express = require('express');
const router = express.Router();
const profileVideoController = require('../controllers/profileVideoController');
const authenticateToken = require('../middlewares/auth-middleware');

router.get('/videos', authenticateToken, profileVideoController.getUserVideos);
router.get('/videos/:id', profileVideoController.getVideoById);

module.exports = router;