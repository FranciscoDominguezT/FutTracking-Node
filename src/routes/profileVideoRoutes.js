const express = require('express');
const router = express.Router();
const profileVideoController = require('../controllers/profileVideoController');

router.get('/videos', profileVideoController.getUserVideos);

module.exports = router;