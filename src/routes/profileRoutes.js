const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authenticateToken = require('../middlewares/auth-middleware');

// Ruta para obtener la información del perfil
router.get('/profile', authenticateToken, profileController.getProfileInfo);
router.get('/perfil', authenticateToken, profileController.getPerfil);

module.exports = router;
