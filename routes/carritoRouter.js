const express = require('express');
const { agregarAlCarrito, obtenerCarritoPorUsuario } = require('../controllers/carrito');
const router = express.Router();

// Ruta para agregar un producto al carrito
router.post('/carrito', agregarAlCarrito);

// Ruta para obtener el carrito de un usuario por su ID
router.get('/carrito/:id_usuario', obtenerCarritoPorUsuario);

module.exports = router;
