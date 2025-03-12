const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const NproductoControllers= require('../controllers/nproductoController')


const upload = multer();


router.post('/cambios',upload.single('imagen'),NproductoControllers.crearProducto);
router.get('/mostrar',NproductoControllers.mostrarProductos);
router.get('/productos-por-categoria',NproductoControllers.obtenerProductosPorCategoria);
module.exports = router;
