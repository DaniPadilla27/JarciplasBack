// File: models/categoriaModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Categoria = sequelize.define('tbl_categorias', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre_categoria: {
    type: DataTypes.STRING(100),
    allowNull: false,
  }
}, {
  timestamps: false,
  tableName: 'tbl_categorias',
  // ⚠️ Importante: No definir relaciones aquí
});

module.exports = Categoria;