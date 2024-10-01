const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth-middleware');

// Rutas para obtener y actualizar los datos de usuario
router.get('/userdata', authenticateToken, userController.getUserData);
router.get('/:id', userController.getUserById);
router.get('/test', userController.test);
router.put('/userdata', authenticateToken, userController.updateUserData);
router.get('/naciones', userController.getNaciones);
router.get('/provincias/:nacionId', userController.getProvincias);
router.get('/', authenticateToken, userController.getCurrentUser);
router.get('/avatar', authenticateToken, userController.getUserAvatar);


module.exports = router;
