const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/:videoId', commentController.getComments);

// Agrega más rutas según sea necesario

module.exports = router;