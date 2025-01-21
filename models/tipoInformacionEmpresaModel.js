const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TipoInformacion = sequelize.define('TipoInformacion', {
  id_tipo_informacion: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  tipo: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
}, {
  tableName: 'tbl_tipo_informacion',
  timestamps: false,
});

module.exports = TipoInformacion;
