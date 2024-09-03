const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rutas para obtener y actualizar los datos de usuario
router.get('/userdata', userController.getUserData);
router.get('/:id', userController.getUserById);
router.get('/test', userController.test);
router.put('/userdata', userController.updateUserData);
router.get('/naciones', userController.getNaciones);
router.get('/provincias/:nacionId', userController.getProvincias);

module.exports = router;
