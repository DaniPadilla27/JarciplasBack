const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    port: process.env.DB_PORT || 3306, // Añade el puerto como variable de entorno o usa 3306 como predeterminado
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a la base de datos establecida con éxito.');
  })
  .catch(err => {
    console.error('❌ No se pudo conectar a la base de datos:', err);
  });

module.exports = sequelize;
