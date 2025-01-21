const express = require('express');
const router = express.Router();
const NproductoControllers= require('../controllers/nproductoController')



router.post('/cambios',NproductoControllers.crearProducto);
router.get('/mostrar',NproductoControllers.mostrarProductos);

module.exports = router;