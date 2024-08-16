const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

// Ruta para obtener la información del perfil
router.get('/profile', profileController.getProfileInfo);

module.exports = router;
