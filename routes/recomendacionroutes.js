const express = require('express');
const router = express.Router();
const { obtenerRecomendaciones } = require('../controllers/recomendacioncontroller');

router.get('/recomendar', obtenerRecomendaciones);

module.exports = router;