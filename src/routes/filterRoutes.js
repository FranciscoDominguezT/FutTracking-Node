const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');

router.get('/players', filterController.getAllPlayers);
router.get('/clubs', filterController.getAllClubs);

module.exports = router;