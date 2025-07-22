const express = require('express');
const router = express.Router();
const { 
  guardarSuscripcionPush,
  obtenerSuscripcionesAdmins // la importas aunque no la uses directamente aquí
} = require('../controllers/notificaciones');

router.post('/suscripcion-push', guardarSuscripcionPush);

// Si más adelante quieres usarla en una ruta tipo GET para depuración o pruebas:
router.get('/suscripciones-admins', async (req, res) => {
  try {
    const subs = await obtenerSuscripcionesAdmins();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener suscripciones' });
  }
});

module.exports = router;
