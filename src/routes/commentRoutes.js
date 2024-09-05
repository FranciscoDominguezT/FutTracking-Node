const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

router.get('/:videoid', commentController.getComments);
router.post('/:commentid/like', commentController.likeComment);
router.get('/comments/:videoid', commentController.getCommentsWithReplies);
router.post('/:videoid/comments', commentController.createComment);
router.delete('/:commentId', commentController.deleteComment);

// Agrega más rutas según sea necesario

module.exports = router;