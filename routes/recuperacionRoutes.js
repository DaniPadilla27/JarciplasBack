// routes/recuperacionRoutes.js
const express = require('express');
const router = express.Router();
const recuperacionController = require('../controllers/recuperacionController');


// Ruta para enviar el código de recuperación
router.post('/recuperacion', recuperacionController.aggUsuarios);


module.exports = router;



