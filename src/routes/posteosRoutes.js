const express = require('express');
const router = express.Router();
const posteosController = require('../controllers/posteosController');

router.get('/', posteosController.getAllPosts);
router.post('/', posteosController.createPost);
router.put('/:id/like', posteosController.updatePost);
router.delete('/:id', posteosController.deletePost);
router.get('/:id/comments', posteosController.getComments);
router.post('/:id/comments', posteosController.createComment);

module.exports = router;