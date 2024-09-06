const express = require('express');
const router = express.Router();
const profileVideoController = require('../controllers/profileVideoController');

router.get('/videos/:id', profileVideoController.getUserVideos);
router.get('/videos/:id', profileVideoController.getVideoById);

module.exports = router;