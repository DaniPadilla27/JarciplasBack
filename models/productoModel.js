const { DataTypes } = require('sequelize');
const sequelize = require('../config/db'); // Asegúrate de que este sea tu archivo de configuración de Sequelize

const Producto = sequelize.define('Producto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre_producto: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    categoria: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'tbl_productos', // Nombre de la tabla en la base de datos
    timestamps: false // Si no necesitas campos createdAt y updatedAt
});

module.exports = Producto;
