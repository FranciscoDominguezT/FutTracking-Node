const express = require('express');
const router = express.Router();
const filterController = require('../controllers/filterController');

router.get('/players', filterController.getAllPlayers);
router.get('/clubs', filterController.getAllClubs);
router.get('/nationalities', filterController.getAllNationalities);
router.get('/positions', filterController.getAllPositions);
router.get('/leagues', filterController.getAllLeagues);

module.exports = router;
