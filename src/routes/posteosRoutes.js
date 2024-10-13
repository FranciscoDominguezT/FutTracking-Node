const express = require('express');
const router = express.Router();
const posteosController = require('../controllers/posteosController');
const authenticateToken = require('../middlewares/auth-middleware');

router.get('/', authenticateToken, posteosController.getAllPosts);
router.post('/', authenticateToken, posteosController.createPost);
router.put('/:id', posteosController.updatePost);
router.delete('/:id', posteosController.deletePost);
router.get('/:id/comments', posteosController.getComments);
router.put('/:postId/like', authenticateToken, posteosController.toggleLike);
router.post('/:id/comments', authenticateToken, posteosController.createComment);
router.get('/user/:userId', posteosController.getPostsByUser);


module.exports = router;