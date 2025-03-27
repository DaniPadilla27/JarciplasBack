const express = require('express');
const multer = require('multer'); 
const router = express.Router();
const NproductoControllers= require('../controllers/nproductoController')
const upload = multer();


router.post('/cambios',upload.single('imagen'),NproductoControllers.crearProducto);
router.get('/mostrar',NproductoControllers.mostrarProductos);
router.get('/productos-por-categoria',NproductoControllers.obtenerProductosPorCategoria);
router.put('/editar/:id',NproductoControllers.editarProducto);
router.delete('/eliminar/:id',NproductoControllers.eliminarProducto);
router.put('/productos/:id',NproductoControllers.actualizarProducto);
router.get('/producto/:id', NproductoControllers.obtenerProductoPorId);
//router.get('/categorias', NproductoControllers.obtenerCategorias);
router.get('/categorias', NproductoControllers.obtenerCategoriasConId);

module.exports = router;
