const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/:videoid', commentController.getComments);
router.post('/:commentid/like', commentController.likeComment);
router.get('/comments/:videoid', commentController.getCommentsWithReplies);

// Agrega más rutas según sea necesario

module.exports = router;