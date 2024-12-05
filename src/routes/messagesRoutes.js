const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['audio/', 'image/', 'video/'];
      if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
        cb(null, true);
      } else {
        cb(new Error('Tipo de archivo no permitido'), false);
      }
    }
  });
const messagesController = require('../controllers/messagesController');
const authenticateToken = require('../middlewares/auth-middleware');

// Get messages between two users
router.get('/:usuarioId/:receptorId', authenticateToken, messagesController.getMessagesBetweenUsers);
router.post('/send', authenticateToken, messagesController.sendMessage);
router.post('/send-audio', authenticateToken, upload.single('audio'), messagesController.sendAudioMessage);
router.post('/send-media', authenticateToken, upload.single('media'), messagesController.sendMediaMessage);

module.exports = router;