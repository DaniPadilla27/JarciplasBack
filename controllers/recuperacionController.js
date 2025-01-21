// require('dotenv').config();
const Usuario = require('../models/usuariosModel');

// Función para agregar un nuevo usuario
// Función para agregar un nuevo usuario
const aggUsuarios = async (req, res) => {
  try {
    const { Nombre, Apellido_Paterno, Apellido_Materno, Edad, Genero, Correo, Telefono, Contraseña } = req.body.datosUsuario;

    // Validar que todos los campos requeridos estén presentes
    if (!Nombre || !Apellido_Paterno || !Apellido_Materno || !Edad || !Genero || !Correo || !Telefono || !Contraseña) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }
console.log("contenido=>",req.body)
    // Crear el nuevo usuario en la base de datos
    const nuevoUsuario = await Usuario.create({
      Nombre,
      Apellido_Paterno,
      Apellido_Materno,
      Edad,
      Genero,
      Correo,
      Telefono,
      Contraseña,
    });

    // Responder con el usuario creado
    return res.status(201).json({ message: 'Usuario creado exitosamente.', usuario: nuevoUsuario });
  } catch (error) {
    console.error('Error al guardar el usuario:', error);
    return res.status(500).json({ message: 'Error en la creación del usuario. Intenta de nuevo.' });
  }
};


module.exports = { aggUsuarios };
