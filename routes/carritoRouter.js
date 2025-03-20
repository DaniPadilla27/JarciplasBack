const express = require('express');
const {
    agregarAlCarrito,
    obtenerCarritoPorUsuario,
    eliminarDelCarrito,
    actualizarCarrito,
} = require('../controllers/carrito');
const router = express.Router();

// Ruta para agregar un producto al carrito
router.post('/carrito', agregarAlCarrito);

// Ruta para obtener el carrito de un usuario por su ID
router.get('/carrito/:id_usuario', obtenerCarritoPorUsuario);

// Ruta para eliminar un producto del carrito
router.delete('/carrito/:id_carrito', eliminarDelCarrito);

// Ruta para actualizar la cantidad de un producto en el carrito
router.put('/carrito/:id_carrito', actualizarCarrito);

module.exports = router;