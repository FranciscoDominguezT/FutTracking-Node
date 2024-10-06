const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const authenticateToken = require('../middlewares/auth-middleware');

// Asegúrate de que estás usando el videoId en la ruta
router.get('/:videoid', commentController.getComments);
router.get('/user', authenticateToken, commentController.getUserComments);
router.post('/:commentid/like', authenticateToken, commentController.likeComment);
router.get('/:videoid/comments', commentController.getCommentsWithReplies); // Puedes eliminar el `?userId` de la solicitud
router.get('/:videoid/countComments', commentController.contarComentariosPorVideo);
router.post('/:videoid/comments', authenticateToken, commentController.createComment);
router.delete('/:commentId', authenticateToken, commentController.deleteComment);

module.exports = router;