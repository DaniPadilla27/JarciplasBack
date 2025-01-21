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
  Apellido_Paterno: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  Apellido_Materno: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  Edad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Genero: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  Correo: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  Telefono: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  Contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  Intentos_contraseña: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  id_sesion: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  bloqueadoHasta: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  MFA:{
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'tbl_usuarios',
  timestamps: false,
});

// Definir la relación
Usuario.belongsTo(TipoUsuario, {
  foreignKey: 'id_tipo_usuario',
  targetKey: 'id_tipo_usuarios',
});

module.exports = Usuario;


