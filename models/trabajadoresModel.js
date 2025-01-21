const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const TipoUsuario = require('./tipo_UsuarioModel'); // Cambiado a TipoUsuario

const Trabajador = sequelize.define('Trabajador', {
  id_trabajador: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
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
  Correo: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
  Telefono: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  id_tipo_trabajador: {  // Cambiado de id_tipo_trabajador a id_tipo_usuario
    type: DataTypes.INTEGER,
    references: {
      model: TipoUsuario, // Cambiado a TipoUsuario
      key: 'id_tipo_usuarios', // Asegúrate de que esta clave coincida con la clave primaria en `TipoUsuario`
    },
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
    type: DataTypes.DATE, // Almacena la fecha y hora hasta cuando está bloqueado
    allowNull: true, // Puede ser nulo cuando no está bloqueado
  },
  Edad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Genero: {
    type: DataTypes.STRING(15),
    allowNull: false,
  },
  MFA:{
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'tbl_trabajadores', // Si decides cambiar el nombre de la tabla en la base de datos, cámbialo aquí también
  timestamps: false,
});

module.exports = Trabajador;

