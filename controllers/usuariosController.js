const axios = require('axios');
const Usuario = require('../models/usuariosModel');
const TipoUsuario = require('../models/tipo_UsuarioModel');
const crypto = require('crypto');
const FrecuenciaBloqueosUsuarios = require('../models/frecuenciaBloqueosUsuariosModel');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const validator = require('validator');
const Configuracion = require('../models/configuracionModel');

const bcrypt = require('bcrypt'); // Importar bcrypt para el hashing de contraseñas
const logger = require('../utils/logger'); // Importamos el logger


const generarIdSesion = () => {
  return crypto.randomBytes(32).toString('hex');
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (error) {
    logger.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error interno al obtener los usuarios' });
  }
};

const obtenerUsuarioPorId = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener el usuario' });
  }
};

// const crearUsuario = async (req, res) => { 
//   const { Nombre, Correo, Contraseña, Telefono, pregunta_secreta, respuesta_secreta, id_tipo_usuario } = req.body;

//   try {
//     if (!Nombre || !Correo || !Contraseña || !Telefono || !pregunta_secreta || !respuesta_secreta) {
//       return res.status(400).json({ message: 'Todos los campos son requeridos.' });
//     }

//     // Sanitización y validación de entradas
//     const sanitizedNombre = validator.escape(Nombre);
//     const sanitizedCorreo = validator.normalizeEmail(Correo);
//     const sanitizedTelefono = validator.escape(Telefono);
//     const sanitizedRespuestaSecreta = validator.escape(respuesta_secreta);
    
//     if (!validator.isEmail(sanitizedCorreo)) {
//       return res.status(400).json({ message: 'Correo electrónico no válido.' });
//     }

//     // Verificar si el correo ya existe en la base de datos
//     const usuarioExistente = await Usuario.findOne({ where: { Correo: sanitizedCorreo } });
//     if (usuarioExistente) {
//       return res.status(400).json({ message: 'El correo ya está registrado. Por favor, usa otro correo.' });
//     }

//     // Hash de la contraseña
//     const saltRounds = 10;
//     const hashedContraseña = await bcrypt.hash(Contraseña, saltRounds);

//     const id_sesion = generarIdSesion();
//     const secret = speakeasy.generateSecret({ length: 20 });
//     const mfaSecret = secret.base32;

//     res.cookie('sessionId', id_sesion, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'Strict',
//       maxAge: 24 * 60 * 60 * 1000
//     });

//     // Si `id_tipo_usuario` no se proporciona, asignar 2 por defecto
//     const nuevoUsuario = await Usuario.create({
//       Nombre: sanitizedNombre,
//       Correo: sanitizedCorreo,
//       Contraseña: hashedContraseña,
//       Telefono: sanitizedTelefono,
//       pregunta_secreta,
//       respuesta_secreta: sanitizedRespuestaSecreta,
//       Intentos_contraseña: 0,
//       id_sesion,
//       id_tipo_usuario: id_tipo_usuario || 4  
//     });

//     res.status(200).json(nuevoUsuario);
//   } catch (error) {
//     logger.error('Error al crear el usuario:', error);
//     res.status(500).json({ message: 'Error interno al crear el usuario' });
//   }
// };


const crearUsuario = async (req, res) => { 
  const { Nombre, Correo, Contraseña, Telefono, pregunta_secreta, respuesta_secreta, id_tipo_usuario } = req.body;

  try {
    if (!Nombre || !Correo || !Contraseña || !Telefono || !pregunta_secreta || !respuesta_secreta) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Sanitización y validación de entradas
    const sanitizedNombre = validator.escape(Nombre);
    const sanitizedCorreo = validator.normalizeEmail(Correo);
    const sanitizedTelefono = validator.escape(Telefono);
    const sanitizedRespuestaSecreta = validator.escape(respuesta_secreta);
    
    if (!validator.isEmail(sanitizedCorreo)) {
      return res.status(400).json({ message: 'Correo electrónico no válido.' });
    }

    // Verificar si el correo ya existe en la base de datos
    const usuarioExistente = await Usuario.findOne({ where: { Correo: sanitizedCorreo } });
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El correo ya está registrado. Por favor, usa otro correo.' });
    }

    // Verificar si el teléfono ya está registrado
    const telefonoExistente = await Usuario.findOne({ where: { Telefono: sanitizedTelefono } });
    if (telefonoExistente) {
      return res.status(400).json({ message: 'El número de teléfono ya está registrado. Por favor, usa otro número.' });
    }

    // Hash de la contraseña
    const saltRounds = 10;
    const hashedContraseña = await bcrypt.hash(Contraseña, saltRounds);

    const id_sesion = generarIdSesion();
    const secret = speakeasy.generateSecret({ length: 20 });
    const mfaSecret = secret.base32;

    res.cookie('sessionId', id_sesion, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    // Si `id_tipo_usuario` no se proporciona, asignar 2 por defecto
    const nuevoUsuario = await Usuario.create({
      Nombre: sanitizedNombre,
      Correo: sanitizedCorreo,
      Contraseña: hashedContraseña,
      Telefono: sanitizedTelefono,
      pregunta_secreta,
      respuesta_secreta: sanitizedRespuestaSecreta,
      Intentos_contraseña: 0,
      id_sesion,
      id_tipo_usuario: id_tipo_usuario || 4  
    });

    res.status(200).json(nuevoUsuario);
  } catch (error) {
    logger.error('Error al crear el usuario:', error);
    res.status(500).json({ message: 'Error interno al crear el usuario' });
  }
};



const iniciarSesionUsuario = async (req, res) => {
  const { Correo, Contraseña } = req.body;
  console.log('[INFO] Iniciando sesión para:', Correo);

  try {
    // Obtener configuración
    const configuracion = await Configuracion.findByPk(1);
    console.log('[INFO] Configuración cargada:', configuracion?.dataValues);

    if (!configuracion) {
      console.error('[ERROR] Configuración no encontrada.');
      return res.status(500).json({ message: 'Error de configuración no disponible.' });
    }

    const cantidadErroresPermitidos = configuracion.cantidad_errores;

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { Correo } });
    console.log('[INFO] Usuario encontrado:', usuario?.dataValues);

    if (!usuario) {
      console.warn('[WARN] Usuario no encontrado con el correo:', Correo);
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Verificar si cuenta está bloqueada
    if (usuario.Intentos_contraseña >= cantidadErroresPermitidos) {
      const tiempoBloqueoRestante = usuario.bloqueadoHasta - Date.now();
      console.log('[INFO] Tiempo de bloqueo restante:', tiempoBloqueoRestante);

      if (tiempoBloqueoRestante > 0) {
        const segundosRestantes = Math.floor(tiempoBloqueoRestante / 1000);
        return res.status(403).json({
          message: `Cuenta bloqueada. Intenta de nuevo en ${segundosRestantes} segundos.`,
        });
      } else {
        console.log('[INFO] Desbloqueando cuenta...');
        usuario.Intentos_contraseña = 0;
        usuario.bloqueadoHasta = null;
        await usuario.save();
      }
    }

    // Comparar contraseñas
    const esCoincidente = await bcrypt.compare(Contraseña, usuario.Contraseña);
    console.log('[INFO] Contraseña coincidente:', esCoincidente);

    if (!esCoincidente) {
      usuario.Intentos_contraseña += 1;

      if (usuario.Intentos_contraseña >= cantidadErroresPermitidos) {
        console.warn('[WARN] Límite de intentos alcanzado. Bloqueando cuenta.');
        usuario.bloqueadoHasta = Date.now() + 5 * 60 * 1000;

        await FrecuenciaBloqueosUsuarios.create({
          id_usuario: usuario.id_usuarios,
          fecha: new Date(),
        });

        await usuario.save();

        return res.status(403).json({ message: 'Cuenta bloqueada temporalmente por intentos fallidos.' });
      }

      await usuario.save();
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Inicio exitoso
    console.log('[INFO] Inicio de sesión exitoso para usuario:', usuario.id_usuarios);
    usuario.Intentos_contraseña = 0;
    usuario.bloqueadoHasta = null;

    const id_sesion = generarIdSesion();
    usuario.id_sesion = id_sesion;
    await usuario.save();

    res.cookie('id_sesion', id_sesion, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      id_usuario: usuario.id_usuarios,
      tipo_usuario: usuario.id_tipo_usuario,
      message: 'Inicio de sesión exitoso.',
    });
  } catch (error) {
    console.error('[ERROR] Error al iniciar sesión:', error);
    res.status(500).json({ message: 'Error interno al iniciar sesión.' });
  }
};




const eliminarUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await usuario.destroy();
    res.status(204).send();
  } catch (error) {
    logger.error('Error al eliminar el usuario:', error);
    res.status(500).json({ message: 'Error interno al eliminar el usuario' });
  }
};

const cambiarRolUsuario = async (req, res) => {
  const { id_usuario, id_tipo_usuario } = req.body; 

  try {
    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    usuario.id_tipo_usuario = id_tipo_usuario;
    await usuario.save();

    res.status(200).json(usuario);
  } catch (error) {
    logger.error('Error al cambiar el rol del usuario:', error);
    res.status(500).json({ message: 'Error interno al cambiar el rol del usuario' });
  }
};

// Función para generar el código QR y el secret para MFA
const generarMFAQR = async (req, res) => {
  const id_usuarios = req.params.id_usuarios;

  try {
    const usuario = await Usuario.findByPk(id_usuarios);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const secret = speakeasy.generateSecret({
      name: 'TuApp (Usuario)',
    });

    usuario.MFA = secret.base32; // Guardar en el campo correcto
    await usuario.save();

    QRCode.toDataURL(secret.otpauth_url, (err, dataUrl) => {
      if (err) {
        logger.error('Error al generar el código QR:', err);
        return res.status(500).json({ message: 'Error interno al generar el código QR.' });
      }

      res.status(200).json({
        qr: dataUrl,
        secret: secret.base32,
      });
    });
  } catch (error) {
    logger.error('Error al generar QR MFA:', error);
    res.status(500).json({ message: 'Error interno al generar QR MFA.' });
  }
};

// Función para verificar el token MFA
const verificarTokenMFA = async (req, res) => {
  const { tokenMFA, id_usuario } = req.body;

  try {
    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const tokenValido = speakeasy.totp.verify({
      secret: usuario.MFA,
      encoding: 'base32',
      token: tokenMFA,
    });

    if (!tokenValido) {
      return res.status(401).json({ message: 'Token MFA inválido.' });
    }

    res.status(200).json({ message: 'Token MFA válido.' });
  } catch (error) {
    logger.error('Error al verificar el token MFA:', error);
    res.status(500).json({ message: 'Error interno al verificar el token MFA.' });
  }
};




const obtenerPerfil = async (req, res) => {
  try {
    const { idSesion } = req.params;  // Obtener el ID de sesión desde los headers
    if (!idSesion) {
      return res.status(401).json({ mensaje: 'No se ha proporcionado un ID de sesión' });
    }

    // Buscar el usuario por el ID de sesión en la base de datos
    const usuario = await Usuario.findOne({
      where: { id_sesion: idSesion },
      attributes: [
        'id_usuarios',
        'Nombre',
        'Apellido_Paterno',
        'Apellido_Materno',
        'Edad',
        'Genero',
        'Correo',
        'Telefono',
      ],
      include: [
        {
          model: TipoUsuario,
          attributes: ['Nombre_Tipo'], // Atributos relevantes del tipo de usuario
        },
      ],
    });

    // Si no se encuentra el usuario o la sesión es inválida
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado o sesión inválida' });
    }

    // Devolver los datos del usuario
    res.json({ usuario });
  } catch (error) {
    logger.error('Error al obtener el perfil:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};


const recuperarConPreguntaSecreta = async (req, res) => {
  const { Telefono, pregunta_secreta, respuesta_secreta, nuevaContraseña } = req.body;

  try {
    if (!Telefono) {
      return res.status(400).json({ message: "El número de teléfono es requerido." });
    }

    // Buscar usuario por teléfono
    const usuario = await Usuario.findOne({ where: { Telefono } });

    if (!usuario) {
      return res.status(404).json({ message: "El número de teléfono no está registrado." });
    }

    // Paso 1: Si solo envió el teléfono, devolvemos la pregunta secreta
    if (!pregunta_secreta) {
      return res.status(200).json({ pregunta_secreta: usuario.pregunta_secreta });
    }

    // Paso 2: Verificar que la pregunta seleccionada coincida
    if (usuario.pregunta_secreta !== pregunta_secreta) {
      return res.status(400).json({ message: "La pregunta secreta no coincide con la registrada." });
    }

    // Paso 3: Si no hay respuesta aún, espera la respuesta secreta
    if (!respuesta_secreta) {
      return res.status(200).json({ message: "Ahora ingresa la respuesta secreta." });
    }

    // Paso 4: Verificar que la respuesta ingresada coincida con la registrada
    if (usuario.respuesta_secreta !== respuesta_secreta) {
      return res.status(400).json({ message: "La respuesta secreta no coincide." });
    }

    // Paso 5: Si la respuesta es correcta, permitir cambiar la contraseña
    if (!nuevaContraseña) {
      return res.status(200).json({ message: "Respuesta correcta. Ahora puedes ingresar una nueva contraseña." });
    }

    // Hash de la nueva contraseña antes de guardarla
    const saltRounds = 10;
    const hashedContraseña = await bcrypt.hash(nuevaContraseña, saltRounds);

    // Actualizar la contraseña en la base de datos
    await usuario.update({ Contraseña: hashedContraseña });

    return res.status(200).json({ message: "Contraseña actualizada correctamente." });

  } catch (error) {
    console.error("Error en la recuperación de contraseña:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};



module.exports = {
  obtenerUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  iniciarSesionUsuario,
  eliminarUsuario,
  cambiarRolUsuario,
  generarMFAQR,
  verificarTokenMFA,
  obtenerPerfil,
  recuperarConPreguntaSecreta
};
