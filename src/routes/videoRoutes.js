const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');


// Rutas correctas
router.get('/:videoId', videoController.getVideoData);
router.get('/:videoId/likes', videoController.getVideoLikes); // Asegúrate de que esta función exista en videoController.js
router.post('/:videoId/like', videoController.likeVideo);
router.get('/:id_seguidor/:usuarioid/follow', videoController.checkFollowStatus);
router.post('/:id_seguidor/:usuarioid/followChange', videoController.handleFollowToggle);






module.exports = router;
