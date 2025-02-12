const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Productos = sequelize.define('productos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nombre_producto: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  imagen: {
    type: DataTypes.BLOB('long'), // Cambia a STRING si prefieres usar URL
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'tbl_productos',
});

module.exports = Productos;
