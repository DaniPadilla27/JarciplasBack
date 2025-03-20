const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Definición del modelo Producto
const Producto = sequelize.define('Producto', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    precio: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    // Agregar otros atributos que necesites
});

// Definición del modelo Carrito
const Carrito = sequelize.define('Carrito', {
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    id_producto: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    precio_unitario: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    precio_total: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
});

// Relación entre Carrito y Producto
Carrito.belongsTo(Producto, { foreignKey: 'id_producto', as: 'producto' });

module.exports = { Carrito, Producto };
