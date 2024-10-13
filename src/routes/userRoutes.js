const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateToken = require('../middlewares/auth-middleware');

// Reordenar las rutas, poniendo las rutas específicas antes de las rutas con parámetros
router.get('/test', userController.test);
router.get('/userdata', authenticateToken, userController.getUserData);
router.put('/userdata', authenticateToken, userController.updateUserData);
router.get('/naciones', userController.getNaciones);
router.get('/provincias/:nacionId', userController.getProvincias);
router.get('/avatar', authenticateToken, userController.getUserAvatar);
router.get('/', authenticateToken, userController.getCurrentUser);

// Poner la ruta con parámetro al final
router.get('/:id', userController.getUserById);

module.exports = router;