require('dotenv').config();
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuariosModel');
const bcrypt = require('bcrypt');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ironsafe3@gmail.com', // Correo electrónico desde el .env
    pass: 'bhiu pxxu gymn xbyo', // Usar variable de entorno
  },
});

const enviarCorreo = async (correo, codigo) => {
  const mailOptions = {
    from: `"Jarciplas" <${process.env.EMAIL_USER}>`,
    to: correo,
    subject: 'Código de verificación',
    html: `<p>Hola,</p>
           <p>Has solicitado restablecer tu contraseña. Aquí tienes tu código de verificación:</p>
           <p><strong>${codigo}</strong></p>
           <p>Este código expirará en 5 minutos.</p>
           <p>Si no has solicitado este cambio, puedes ignorar este mensaje.</p>`,
  };

  try {
    console.log(`Enviando correo a: ${correo} con código: ${codigo}`);
    await transporter.sendMail(mailOptions);
    console.log('Correo enviado exitosamente');
  } catch (error) {
    console.error('Error al enviar el correo:', error);
  }
};

const solicitarRecuperacion = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Usuario.findOne({ where: { Correo: email } });

    if (!user) {
      return res.status(400).json({ message: 'El usuario no está registrado.' });
    }

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generar código de recuperación
    const recoveryCodeExpires = new Date(new Date().getTime() + 5 * 60000); // 5 minutos

    // Actualizar el usuario con el código y la fecha de expiración
    await user.update({
      codigo_recuperacion: recoveryCode,
      codigo_recuperacion_expiracion: recoveryCodeExpires,
    });

    await enviarCorreo(email, recoveryCode); // Enviar el código por correo

    return res.json({ message: 'Código enviado exitosamente' });
  } catch (error) {
    console.error('Error en la solicitud de recuperación:', error);
    return res.status(500).json({ message: 'Error al enviar el código. Intenta de nuevo.' });
  }
};

const verificarCodigo = async (req, res) => {
  const { codigo, email } = req.body;

  try {
    const user = await Usuario.findOne({ where: { Correo: email } });

    if (!user) {
      return res.status(400).json({ message: 'El usuario no está registrado.' });
    }

    // Verificar si el código coincide y no ha expirado
    if (
      user.codigo_recuperacion === codigo.trim() &&
      new Date(user.codigo_recuperacion_expiracion) > new Date()
    ) {
      return res.json({ message: 'Código verificado correctamente.' });
    } else {
      return res.status(400).json({ message: 'Código incorrecto o expirado. Intenta de nuevo.' });
    }
  } catch (error) {
    console.error('Error en la verificación del código:', error);
    return res.status(500).json({ message: 'Error en la verificación. Intenta de nuevo.' });
  }
};


const actualizarContrasena = async (req, res) => {
  const { correo, nuevaContrasena } = req.body;
  console.log(req.body);

  try {
    // Buscar al usuario por su correo
    const user = await Usuario.findOne({ where: { Correo: correo } });

    if (!user) {
      return res.status(400).json({ message: 'El usuario no está registrado.' });
    }

    // Hashear la nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar la contraseña y limpiar los campos de recuperación
    await Usuario.update(
      {
        Contraseña: hashedPassword, // Actualiza la contraseña
        codigo_recuperacion: null, // Limpia el código de recuperación
        codigo_recuperacion_expiracion: null, // Limpia la fecha de expiración
      },
      {
        where: { Correo: correo }, // Condición para actualizar el usuario con el correo especificado
      }
    );

    return res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al actualizar la contraseña:', error);
    return res.status(500).json({ message: 'Ocurrió un problema. Intenta más tarde.' });
  }
};
module.exports = { solicitarRecuperacion, verificarCodigo, actualizarContrasena };