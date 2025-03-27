// filepath: c:\Users\paca2\OneDrive\Documentos\Jarciplas\bak\models\categoriasModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Categoria = sequelize.define('tbl_categorias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nombre_categoria: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  timestamps: false,
  tableName: 'tbl_categorias',
});

module.exports = Categoria;