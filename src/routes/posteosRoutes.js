const express = require('express');
const router = express.Router();
const posteosController = require('../controllers/posteosController');
const authenticateToken = require('../middlewares/auth-middleware');

router.get('/', authenticateToken, posteosController.getAllPosts);
router.post('/', posteosController.createPost);
router.put('/:id', posteosController.updatePost);
router.delete('/:id', posteosController.deletePost);
router.get('/:id/comments', posteosController.getComments);
router.post('/:id/comments', posteosController.createComment);
router.delete('/:id/comments/:commentId', posteosController.deleteComment);
router.put('/:postId/like', (req, res, next) => {
    console.log('Request params:', req.params);
    next();
  }, posteosController.toggleLike);



module.exports = router;