const express = require('express');
const router = express.Router();
const tipoInformacionController = require('../controllers/tipoInformacionEmpresaController');

router.get('/tipos_informacion', tipoInformacionController.obtenerTiposInformacion);
router.post('/tipos_informacion', tipoInformacionController.crearTipoInformacion);

module.exports = router;
