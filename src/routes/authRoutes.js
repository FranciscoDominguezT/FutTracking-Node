const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta para el login
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.post('/', authController.register);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
