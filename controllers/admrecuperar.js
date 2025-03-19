const Usuario = require('../models/usuariosModel'); // Importa el modelo de usuario
const bcrypt = require('bcrypt'); // Para encriptar la contraseña
const logger = require('../utils/logger'); // Importa el logger

// Controlador para obtener la lista de todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll({
            attributes: ['id_usuarios', 'Nombre', 'Apellido_Paterno', 'Apellido_Materno', 'Correo', 'Telefono'],
            include: [{ model: require('../models/tipo_UsuarioModel'), attributes: ['nombre_tipo'] }]
        });

        logger.info('Lista de usuarios obtenida correctamente'); // ✅ Log exitoso
        res.status(200).json(usuarios);
    } catch (error) {
        logger.error(`Error al obtener la lista de usuarios: ${error.message}`); // ❌ Log de error
        res.status(500).json({ message: 'Error al obtener la lista de usuarios' });
    }
};

// Controlador para actualizar los datos de un usuario específico
const actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { Nombre, Apellido_Paterno, Apellido_Materno, Edad, Genero, Correo, Telefono, Contraseña, MFA } = req.body;

    logger.info(`Solicitud de actualización de usuario ID: ${id}`); // ✅ Log informativo
    logger.info(`Usuario: ${Nombre}, Correo: ${Correo}`);

    try {
        const datosActualizados = {
            Nombre,
            Apellido_Paterno,
            Apellido_Materno,
            Edad,
            Genero,
            Correo,
            Telefono,
            MFA
        };
        
        if (Contraseña) {
            const hashedPassword = await bcrypt.hash(Contraseña, 10);
            datosActualizados.Contraseña = hashedPassword;
        }

        const usuarioActualizado = await Usuario.update(datosActualizados, { where: { id_usuarios: id } });

        if (usuarioActualizado[0] === 0) {
            logger.warn(`Usuario con ID ${id} no encontrado`); // ⚠️ Log de advertencia
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        logger.info(`Usuario con ID ${id} actualizado correctamente`); // ✅ Log exitoso
        res.status(200).json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
        logger.error(`Error al actualizar el usuario con ID ${id}: ${error.message}`); // ❌ Log de error
        res.status(500).json({ message: 'Error al actualizar el usuario' });
    }
};

module.exports = {
    obtenerUsuarios,
    actualizarUsuario
};
