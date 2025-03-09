require('dotenv').config();
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuariosModel');

let recoveryCode; // Variable para almacenar el código de verificación

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ironsafe3@gmail.com', // Correo electrónico desde el .env
    pass: 'bhiu pxxu gymn xbyo', // Usar variable de entorno
  },
});

const enviarCorreo = async (correo, codigo) => {
  const mailOptions = {
    from: `"Tu Nombre" <${process.env.EMAIL_USER}>`,
    to: correo,
    subject: 'Código de verificación',
    html: `<p>Hola,</p>
           <p>Has solicitado restablecer tu contraseña. Aquí tienes tu código de verificación:</p>
           <p><strong>${codigo}</strong></p>
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

    recoveryCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generar código de recuperación

    await enviarCorreo(email, recoveryCode); // Pasar el código generado

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
      user.recoveryCode === codigo.trim() &&
      new Date(user.recoveryCodeExpires) > new Date()
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

module.exports = { solicitarRecuperacion, verificarCodigo };
