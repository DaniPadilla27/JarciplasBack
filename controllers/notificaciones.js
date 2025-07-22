const sequelize = require('../config/db');
const webpush = require('../config/pushConfig');
const { QueryTypes } = require('sequelize');

// Guardar suscripción push
const guardarSuscripcionPush = async (req, res) => {
  const { id_usuario, endpoint, p256dh, auth } = req.body;

  if (!id_usuario || !endpoint || !p256dh || !auth) {
    return res.status(400).json({ message: "Faltan datos de suscripción" });
  }

  try {
    // Verificar que el usuario exista
    const usuarioExiste = await sequelize.query(
      `SELECT 1 FROM tbl_usuarios WHERE id_usuarios = :id_usuario`,
      {
        replacements: { id_usuario },
        type: QueryTypes.SELECT,
      }
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Insertar o actualizar la suscripción
    await sequelize.query(
      `INSERT INTO tbl_push_subscriptions (id_usuario, endpoint, p256dh, auth)
       VALUES (:id_usuario, :endpoint, :p256dh, :auth)
       ON DUPLICATE KEY UPDATE
         p256dh = VALUES(p256dh),
         auth = VALUES(auth),
         fecha = CURRENT_TIMESTAMP`,
      {
        replacements: { id_usuario, endpoint, p256dh, auth },
        type: QueryTypes.INSERT,
      }
    );

    res.status(200).json({ message: 'Suscripción guardada correctamente' });
  } catch (error) {
    console.error('Error al guardar la suscripción:', error);
    res.status(500).json({ message: 'Error al guardar la suscripción' });
  }
};

// Obtener solo suscripciones de administradores
const obtenerSuscripcionesAdmins = async () => {
  try {
    const suscripciones = await sequelize.query(
      `SELECT ps.endpoint, ps.p256dh, ps.auth
       FROM tbl_push_subscriptions ps
       JOIN tbl_usuarios u ON ps.id_usuario = u.id_usuarios
       WHERE u.id_tipo_usuario = 1`,
      {
        type: QueryTypes.SELECT,
      }
    );

    return suscripciones;
  } catch (error) {
    console.error('Error al obtener suscripciones de administradores:', error);
    return [];
  }
};

const notificarAdminsSiStockBajo = async () => {
  try {
    const productosBajoStock = await sequelize.query(
      `SELECT id, nombre_producto, stock FROM tbl_productos WHERE stock < 15`,
      { type: QueryTypes.SELECT }
    );

    if (productosBajoStock.length === 0) return;

    const suscripciones = await obtenerSuscripcionesAdmins();

    for (const producto of productosBajoStock) {
      const payload = JSON.stringify({
        title: '¡Atención!',
        body: `El producto "${producto.nombre_producto}" tiene stock bajo (${producto.stock} unidades).`,
        icon: 'https://www.jarciplas.com/assets/img/logos/logo_med.png', // Puedes personalizar esto
        data: { productoId: producto.id }
      });

      for (const sub of suscripciones) {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(subscription, payload);
        } catch (err) {
          console.error('Error al enviar notificación:', err);
        }
      }
    }

    console.log("Notificaciones enviadas a administradores.");
  } catch (err) {
    console.error("Error al verificar stock bajo:", err);
  }
};

module.exports = {
  guardarSuscripcionPush,
  obtenerSuscripcionesAdmins,
  notificarAdminsSiStockBajo
};
