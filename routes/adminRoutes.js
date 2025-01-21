// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { obtenerUsuarios, actualizarUsuario } = require('../controllers/admrecuperar');

// Ruta para obtener la lista de usuarios
router.get('/usuarios', obtenerUsuarios);

// Ruta para actualizar los datos de un usuario específico
router.put('/usuarios/:id', actualizarUsuario);

module.exports = router;
