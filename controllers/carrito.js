const sequelize = require('../config/db');  // Asegúrate de tener la configuración de la base de datos
const { QueryTypes } = require('sequelize');
const { notificarAdminsSiStockBajo } = require('./notificaciones');

// Controlador para agregar un producto al carrito
const agregarAlCarrito = async (req, res) => {
    const { id_usuario, id_producto, cantidad } = req.body;

    try {
        // Verificar si el producto ya existe en el carrito del usuario
        const existingItem = await sequelize.query(
            `SELECT * FROM tbl_carrito_compras WHERE id_usuario = :id_usuario AND id_producto = :id_producto AND estado = 'pendiente'`,
            {
                replacements: { id_usuario, id_producto },
                type: QueryTypes.SELECT,
            }
        );

        if (existingItem && existingItem.length > 0) {
            // Si existe, incrementar la cantidad
            const newCantidad = existingItem[0].cantidad + cantidad;
            const precioUnitario = await sequelize.query(
                `SELECT precio AS precio_unitario FROM tbl_productos WHERE id = :id_producto`,
                {
                    replacements: { id_producto },
                    type: QueryTypes.SELECT,
                }
            );

            if (!precioUnitario || precioUnitario.length === 0 || precioUnitario[0].precio_unitario === null) {
                return res.status(400).json({ message: "Producto no encontrado o precio no definido" });
            }

            const precio_unitario = precioUnitario[0].precio_unitario;
            const precio_total = precio_unitario * newCantidad;

            await sequelize.query(
                `UPDATE tbl_carrito_compras 
                 SET cantidad = :cantidad, precio_total = :precio_total 
                 WHERE id_carrito = :id_carrito`,
                {
                    replacements: {
                        cantidad: newCantidad,
                        precio_total,
                        id_carrito: existingItem[0].id_carrito,
                    },
                    type: QueryTypes.UPDATE,
                }
            );
        } else {
            // Si no existe, obtener el precio y crear un nuevo registro
            const precioUnitario = await sequelize.query(
                `SELECT precio AS precio_unitario FROM tbl_productos WHERE id = :id_producto`,
                {
                    replacements: { id_producto },
                    type: QueryTypes.SELECT,
                }
            );

            if (!precioUnitario || precioUnitario.length === 0 || precioUnitario[0].precio_unitario === null) {
                return res.status(400).json({ message: "Producto no encontrado o precio no definido" });
            }

            const precio_unitario = precioUnitario[0].precio_unitario;
            const precio_total = precio_unitario * cantidad;

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
        }

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
                p.stock,
                c.cantidad,
                c.precio_unitario,
                c.precio_total,
                c.estado,
                c.fecha_agregado,
                p.imagen
               
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
        // Validación de cantidad
        if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
            return res.status(400).json({ message: "Cantidad inválida" });
        }

        // Verificar si el item existe en el carrito
        const item = await sequelize.query(
            `SELECT c.id_carrito, c.id_producto, c.cantidad, p.stock, p.precio AS precio_unitario 
             FROM tbl_carrito_compras c 
             JOIN tbl_productos p ON c.id_producto = p.id 
             WHERE c.id_carrito = :id_carrito`,
            {
                replacements: { id_carrito },
                type: QueryTypes.SELECT,
            }
        );

        if (!item || item.length === 0) {
            return res.status(404).json({ message: "El producto no existe en el carrito" });
        }

        const { id_producto, stock, precio_unitario } = item[0];
        if (stock < cantidad) {
            return res.status(400).json({ message: `Stock insuficiente. Disponible: ${stock}` });
        }

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

const comprarCarrito = async (req, res) => {
    const { id_usuario } = req.params; // Obtener id_usuario desde los parámetros de la URL

    try {
        // Iniciar una transacción para garantizar la consistencia de los datos
        const transaction = await sequelize.transaction();

        try {
            // Insertar los productos del carrito en la tabla de ventas
            await sequelize.query(
                `INSERT INTO tbl_ventas (id_usuario, id_producto, cantidad, precio_unitario, precio_total, fecha_venta)
                 SELECT id_usuario, id_producto, cantidad, precio_unitario, precio_total, NOW()
                 FROM tbl_carrito_compras
                 WHERE id_usuario = :id_usuario AND estado = 'pendiente'`,
                {
                    replacements: { id_usuario },
                    type: QueryTypes.INSERT,
                    transaction,
                }
            );

            // Actualizar el stock de los productos
            // Actualizar el stock de los productos
            await sequelize.query(
                `UPDATE tbl_productos p
     JOIN tbl_carrito_compras c ON p.id = c.id_producto
     SET p.stock = p.stock - c.cantidad
     WHERE c.id_usuario = :id_usuario AND c.estado = 'pendiente'`,
                {
                    replacements: { id_usuario },
                    type: QueryTypes.UPDATE,
                    transaction,
                }
            );

                        // Aquí llamas a la función de notificaciones
            await notificarAdminsSiStockBajo();


            // Eliminar los productos del carrito
            await sequelize.query(
                `DELETE FROM tbl_carrito_compras 
                 WHERE id_usuario = :id_usuario AND estado = 'pendiente'`,
                {
                    replacements: { id_usuario },
                    type: QueryTypes.DELETE,
                    transaction,
                }
            );

            // Confirmar la transacción
            await transaction.commit();

            res.status(200).json({ message: "Compra realizada con éxito y stock actualizado" });
        } catch (error) {
            // Revertir la transacción en caso de error
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error al realizar la compra" });
    }
};

module.exports = { agregarAlCarrito, obtenerCarritoPorUsuario, eliminarDelCarrito, actualizarCarrito, comprarCarrito };
