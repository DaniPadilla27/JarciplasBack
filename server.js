const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Importa el paquete cors
const cookieParser = require('cookie-parser'); // Importa el paquete cookie-parser
const sequelize = require('./config/db');

const tipoTrabajadorRoutes = require('./routes/tipo_UusuarioRoutes');
const trabajadorRoutes = require('./routes/trabajadoresRoutes');
const usuarioRoutes = require('./routes/usuariosRoutes');
const FrecuenciaBloqueosUsuarios = require('./routes/FrecuenciaBloqueosUsuariosRoutes');
const FrecuenciaBloqueosTrabajador = require('./routes/FrecuenciaBloqueosTrabajadoreRoutes');
const captcha = require('./routes/captchaRoutes');
const Politicas = require('./routes/politicasRoutes');
const HistorialPoliticas = require('./routes/historialPoliticasRoutes');
const DeslindeLegal = require('./routes/deslindeRoutes');
const HistorialDeslinde = require('./routes/historialDeslindeRoutes');
const Terminos = require('./routes/terminosRoutes');
const HistorialTerminos = require('./routes/historialTerminosRoutes');
const Configuracion = require('./routes/configuracionRoutes');
const InformacionEmpresa = require('./routes/informacionEmpresaRoutes');
const contactoEmpresa = require('./routes/contactoEmpresaRoutes');
const Recuperacion = require('./routes/recuperacionRoutes');
const AdmRecuperacion = require('./routes/adminRoutes');
const cloudinary = require('./routes/cloudinary');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware para parsear JSON
app.use(express.json());

// Middleware para manejar CORS
app.use(cors());

// Middleware para manejar cookies
app.use(cookieParser()); // Agrega el middleware cookie-parser aquí

// Rutas
app.use('/api', tipoTrabajadorRoutes);
app.use('/api', trabajadorRoutes);
app.use('/api', usuarioRoutes);
app.use('/api', captcha);
app.use('/api', FrecuenciaBloqueosUsuarios);
app.use('/api', FrecuenciaBloqueosTrabajador);
app.use('/api', Politicas);
app.use('/api', HistorialPoliticas);
app.use('/api', DeslindeLegal);
app.use('/api', HistorialDeslinde);
app.use('/api', Terminos);
app.use('/api', HistorialTerminos);
app.use('/api', Configuracion);
app.use('/api', InformacionEmpresa);
app.use('/api', contactoEmpresa);
app.use('/api', Recuperacion);
app.use('/api', AdmRecuperacion);
app.use('/api', cloudinary);

// Conexión a la base de datos
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}).catch(err => {
  console.error('Error al sincronizar la base de datos:', err);
});

