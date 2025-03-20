const sequelize = require('../config/db');  // Asegúrate de tener la configuración de la base de datos
const { QueryTypes } = require('sequelize');

// Controlador para agregar un producto al carrito
const agregarAlCarrito = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    try {
        // Consulta dinámica para obtener el precio del producto
        const precioUnitario = await sequelize.query(
            `SELECT IFNULL(precio, 34.00) AS precio_unitario FROM tbl_productos WHERE id = :id_producto`,
            {
                replacements: { id_producto },
                type: QueryTypes.SELECT,
            }
        );

        // Verificar que el precio se haya obtenido correctamente
        if (!precioUnitario || precioUnitario.length === 0) {
            return res.status(400).json({ message: "Producto no encontrado" });
        }

        const precio_unitario = precioUnitario[0].precio_unitario;
        const precio_total = precio_unitario * cantidad;

        // Insertar en el carrito
        await sequelize.query(
            `INSERT INTO tbl_carrito_compras (id_usuario, id_producto, cantidad, precio_unitario, precio_total, estado)
            VALUES (:id_usuario, :id_producto, :cantidad, :precio_unitario, :precio_total, 'pendiente')`,
            {
                replacements: {
                    id_usuario,
                    id_producto,
                    cantidad,
                    precio_unitario,
                    precio_total,
                },
                type: QueryTypes.INSERT,
            }
        );

        res.status(201).json({ message: "Producto agregado al carrito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al agregar al carrito" });
    }
};

// Controlador para obtener el carrito de un usuario
const obtenerCarritoPorUsuario = async (req, res) => {
    const { id_usuario } = req.params;

    try {
        // Consulta dinámica para obtener el carrito de compras
        const carrito = await sequelize.query(
            `SELECT 
                c.id_carrito,
                c.id_usuario,
                c.id_producto,
                p.nombre_producto,
                p.imagen,
                c.cantidad,
                c.precio_unitario,
                c.precio_total,
                c.estado,
                c.fecha_agregado
            FROM 
                tbl_carrito_compras c
            JOIN 
                tbl_productos p ON c.id_producto = p.id
            WHERE 
                c.id_usuario = :id_usuario`,
            {
                replacements: { id_usuario },
                type: QueryTypes.SELECT,
            }
        );

        if (!carrito || carrito.length === 0) {
            return res.status(404).json({ message: "Carrito vacío o usuario no encontrado" });
        }

        res.status(200).json(carrito);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al obtener el carrito" });
    }
};
// Controlador para eliminar un producto del carrito
const eliminarDelCarrito = async (req, res) => {
    const { id_carrito } = req.params;

    try {
        // Verificar si el item existe en el carrito
        const item = await sequelize.query(
            `SELECT * FROM tbl_carrito_compras WHERE id_carrito = :id_carrito`,
            {
                replacements: { id_carrito },
                type: QueryTypes.SELECT,
            }
        );

        if (!item || item.length === 0) {
            return res.status(404).json({ message: "El producto no existe en el carrito" });
        }

        // Eliminar el item del carrito
        await sequelize.query(
            `DELETE FROM tbl_carrito_compras WHERE id_carrito = :id_carrito`,
            {
                replacements: { id_carrito },
                type: QueryTypes.DELETE,
            }
        );

        res.status(200).json({ message: "Producto eliminado del carrito" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al eliminar el producto del carrito" });
    }
};
// Controlador para actualizar la cantidad de un producto en el carrito
const actualizarCarrito = async (req, res) => {
    const { id_carrito } = req.params;
    const { cantidad } = req.body;

    try {
        // Verificar si el item existe en el carrito
        const item = await sequelize.query(
            `SELECT * FROM tbl_carrito_compras WHERE id_carrito = :id_carrito`,
            {
                replacements: { id_carrito },
                type: QueryTypes.SELECT,
            }
        );

        if (!item || item.length === 0) {
            return res.status(404).json({ message: "El producto no existe en el carrito" });
        }

        // Obtener el precio unitario del producto
        const precioUnitario = await sequelize.query(
            `SELECT IFNULL(precio, 34.00) AS precio_unitario FROM tbl_productos WHERE id = :id_producto`,
            {
                replacements: { id_producto: item[0].id_producto },
                type: QueryTypes.SELECT,
            }
        );

        if (!precioUnitario || precioUnitario.length === 0) {
            return res.status(400).json({ message: "Producto no encontrado" });
        }

        const precio_unitario = precioUnitario[0].precio_unitario;
        const precio_total = precio_unitario * cantidad;

        // Actualizar la cantidad y el precio total en el carrito
        await sequelize.query(
            `UPDATE tbl_carrito_compras 
             SET cantidad = :cantidad, precio_total = :precio_total 
             WHERE id_carrito = :id_carrito`,
            {
                replacements: { cantidad, precio_total, id_carrito },
                type: QueryTypes.UPDATE,
            }
        );

        res.status(200).json({ message: "Carrito actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al actualizar el carrito" });
    }
};

module.exports = { agregarAlCarrito, obtenerCarritoPorUsuario ,eliminarDelCarrito, actualizarCarrito };
