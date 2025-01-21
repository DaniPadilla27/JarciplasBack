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

const generarIdSesion = () => {
  return crypto.randomBytes(32).toString('hex');
};

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
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

const crearUsuario = async (req, res) => {
  const { Nombre, Apellido_Paterno, Apellido_Materno, Edad, Genero, Correo, Telefono, Contraseña, id_tipo_usuario } = req.body;

  try {
    if (!Nombre || !Apellido_Paterno || !Apellido_Materno || !Edad || !Genero || !Correo || !Telefono || !Contraseña || !id_tipo_usuario) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    // Sanitización y validación de entradas
    const sanitizedNombre = validator.escape(Nombre);
    const sanitizedApellidoPaterno = validator.escape(Apellido_Paterno);
    const sanitizedApellidoMaterno = validator.escape(Apellido_Materno);
    const sanitizedCorreo = validator.normalizeEmail(Correo);
    const sanitizedTelefono = validator.escape(String(Telefono));
    
    if (!validator.isEmail(sanitizedCorreo)) {
      return res.status(400).json({ message: 'Correo electrónico no válido.' });
    }

    // Hash de la contraseña
    const saltRounds = 10; // Puedes ajustar esto según la seguridad deseada
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

    const nuevoUsuario = await Usuario.create({
      Nombre: sanitizedNombre,
      Apellido_Paterno: sanitizedApellidoPaterno,
      Apellido_Materno: sanitizedApellidoMaterno,
      Edad,
      Genero,
      Correo: sanitizedCorreo,
      Telefono: sanitizedTelefono,
      Contraseña: hashedContraseña, // Guarda la contraseña hasheada
      Intentos_contraseña: 0,
      id_sesion,
      id_tipo_usuario,
      MFA: mfaSecret
    });

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ message: 'Error interno al crear el usuario' });
  }
};

const iniciarSesionUsuario = async (req, res) => {
  const { Correo, Contraseña, tokenMFA } = req.body;

  try {
    // Obtener la cantidad de errores permitidos desde la configuración
    const configuracion = await Configuracion.findByPk(1);
    if (!configuracion) {
      return res.status(500).json({ message: 'Error de configuración no disponible.' });
    }

    const cantidadErroresPermitidos = configuracion.cantidad_errores;

    // Buscar el usuario por correo
    const usuario = await Usuario.findOne({ where: { Correo } });

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Verificar si la cuenta está bloqueada
    if (usuario.Intentos_contraseña >= cantidadErroresPermitidos) {
      const tiempoBloqueoRestante = usuario.bloqueadoHasta - Date.now();

      if (tiempoBloqueoRestante > 0) {
        const segundosRestantes = Math.floor(tiempoBloqueoRestante / 1000);
        return res.status(403).json({
          message: `Cuenta bloqueada. Intenta de nuevo en ${segundosRestantes} segundos.`,
        });
      } else {
        // Restablecer el contador de intentos y desbloquear la cuenta
        usuario.Intentos_contraseña = 0;
        usuario.bloqueadoHasta = null;
        await usuario.save();
      }
    }

    // Comparar la contraseña ingresada con la almacenada
    const esCoincidente = await bcrypt.compare(Contraseña, usuario.Contraseña); // usuario.Contraseña es el hash

    if (!esCoincidente) {
      usuario.Intentos_contraseña += 1;

      // Bloquear cuenta si se alcanzó el límite de intentos
      if (usuario.Intentos_contraseña >= cantidadErroresPermitidos) {
        usuario.bloqueadoHasta = Date.now() + 5 * 60 * 1000; // Bloquear por 5 minutos
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

    // Restablecer intentos y proceder con el inicio de sesión exitoso
    usuario.Intentos_contraseña = 0;
    usuario.bloqueadoHasta = null;

    // Verificar MFA si está habilitado
    if (usuario.MFA) {
      const tokenValido = speakeasy.totp.verify({
        secret: usuario.MFA,
        encoding: 'base32',
        token: tokenMFA,
      });

      if (!tokenValido) {
        return res.status(401).json({ message: 'Token MFA inválido.' });
      }
    }

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
    });
    
  } catch (error) {
    console.error('Error al iniciar sesión del usuario:', error);
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
    console.error('Error al eliminar el usuario:', error);
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
    console.error('Error al cambiar el rol del usuario:', error);
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
        console.error('Error al generar el código QR:', err);
        return res.status(500).json({ message: 'Error interno al generar el código QR.' });
      }

      res.status(200).json({
        qr: dataUrl,
        secret: secret.base32,
      });
    });
  } catch (error) {
    console.error('Error al generar QR MFA:', error);
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
    console.error('Error al verificar el token MFA:', error);
    res.status(500).json({ message: 'Error interno al verificar el token MFA.' });
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
};
