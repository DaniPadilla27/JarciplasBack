const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const TipoUsuario = require('./tipo_UsuarioModel');

const Usuario = sequelize.define('Usuario', {
  id_usuarios: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_tipo_usuario: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: TipoUsuario,
      key: 'id_tipo_usuarios',
    },
  },
  Nombre: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  Correo: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
  },
  Telefono: {
    type: DataTypes.STRING(15),
    allowNull: true,
  },
  Contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Intentos_contraseña: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  id_sesion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  bloqueadoHasta: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  MFA: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  codigo_recuperacion: {
    type: DataTypes.STRING(6), // Código de 6 dígitos
    allowNull: true,
  },
  codigo_recuperacion_expiracion: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'tbl_usuarios',
  timestamps: false,
});

Usuario.belongsTo(TipoUsuario, {
  foreignKey: 'id_tipo_usuario',
  targetKey: 'id_tipo_usuarios',
});

module.exports = Usuario;