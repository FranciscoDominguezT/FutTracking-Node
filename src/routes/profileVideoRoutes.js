const express = require('express');
const router = express.Router();
const profileVideoController = require('../controllers/profileVideoController');
const authenticateToken = require('../middlewares/auth-middleware');

router.get('/videos/:usuarioId', authenticateToken, profileVideoController.getUserVideos);
router.get('/videos/:id', profileVideoController.getVideoById);
router.get('/my-videos', authenticateToken, profileVideoController.getLoggedInUserVideos);

module.exports = router;