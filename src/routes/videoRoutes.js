const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authenticateToken = require('../middlewares/auth-middleware');


// Rutas correctas
router.get('/:videoId', videoController.getVideoData);
router.get('/:videoId/likes', videoController.getVideoLikes); // Asegúrate de que esta función exista en videoController.js
router.post('/:videoId/like', authenticateToken, videoController.likeVideo);
router.get('/:id_seguidor/:usuarioid/follow', videoController.checkFollowStatus);
router.post('/:id_seguidor/:usuarioid/followChange', videoController.handleFollowToggle);
router.get('/player/:id', videoController.getVideoUploaderProfile);


module.exports = router;
