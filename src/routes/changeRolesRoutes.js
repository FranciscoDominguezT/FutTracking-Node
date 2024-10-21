const express = require('express');
const router = express.Router();
const changeRolesController = require('../controllers/changeRolesController');

router.post('/verify-aficionado', changeRolesController.verifyAficionado);
router.post('/changeToPlayer', changeRolesController.changeToPlayer);
router.post('/changeToRecruiter', changeRolesController.changeToRecruiter);
router.get('/getLigas', changeRolesController.getLigas);
router.get('/getEquipos', changeRolesController.getEquipos);
router.get('/getPosiciones', changeRolesController.getPosiciones);
router.get('/getNaciones', changeRolesController.getNaciones);
router.get('/getProvincias/:nacionId', changeRolesController.getProvincias);

module.exports = router;