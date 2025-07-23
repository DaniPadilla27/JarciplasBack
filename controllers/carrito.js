const sequelize = require("../config/db")
const { QueryTypes } = require("sequelize")
const { notificarAdminsSiStockBajo } = require("./notificaciones")

// Mantén todas las funciones existentes igual...
const agregarAlCarrito = async (req, res) => {
  const { id_usuario, id_producto, cantidad } = req.body
  try {
    const existingItem = await sequelize.query(
      `SELECT * FROM tbl_carrito_compras WHERE id_usuario = :id_usuario AND id_producto = :id_producto AND estado = 'pendiente'`,
      {
        replacements: { id_usuario, id_producto },
        type: QueryTypes.SELECT,
      },
    )

    if (existingItem && existingItem.length > 0) {
      const newCantidad = existingItem[0].cantidad + cantidad
      const precioUnitario = await sequelize.query(
        `SELECT precio AS precio_unitario FROM tbl_productos WHERE id = :id_producto`,
        {
          replacements: { id_producto },
          type: QueryTypes.SELECT,
        },
      )

      if (!precioUnitario || precioUnitario.length === 0 || precioUnitario[0].precio_unitario === null) {
        return res.status(400).json({ message: "Producto no encontrado o precio no definido" })
      }

      const precio_unitario = precioUnitario[0].precio_unitario
      const precio_total = precio_unitario * newCantidad

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
        },
      )
    } else {
      const precioUnitario = await sequelize.query(
        `SELECT precio AS precio_unitario FROM tbl_productos WHERE id = :id_producto`,
        {
          replacements: { id_producto },
          type: QueryTypes.SELECT,
        },
      )

      if (!precioUnitario || precioUnitario.length === 0 || precioUnitario[0].precio_unitario === null) {
        return res.status(400).json({ message: "Producto no encontrado o precio no definido" })
      }

      const precio_unitario = precioUnitario[0].precio_unitario
      const precio_total = precio_unitario * cantidad

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
        },
      )
    }

    res.status(201).json({ message: "Producto agregado al carrito" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al agregar al carrito" })
  }
}

const obtenerCarritoPorUsuario = async (req, res) => {
  const { id_usuario } = req.params
  try {
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
                c.id_usuario = :id_usuario AND c.estado = 'pendiente'`,
      {
        replacements: { id_usuario },
        type: QueryTypes.SELECT,
      },
    )

    if (!carrito || carrito.length === 0) {
      return res.status(404).json({ message: "Carrito vacío o usuario no encontrado" })
    }

    res.status(200).json(carrito)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener el carrito" })
  }
}

const eliminarDelCarrito = async (req, res) => {
  const { id_carrito } = req.params
  try {
    const item = await sequelize.query(`SELECT * FROM tbl_carrito_compras WHERE id_carrito = :id_carrito`, {
      replacements: { id_carrito },
      type: QueryTypes.SELECT,
    })

    if (!item || item.length === 0) {
      return res.status(404).json({ message: "El producto no existe en el carrito" })
    }

    await sequelize.query(`DELETE FROM tbl_carrito_compras WHERE id_carrito = :id_carrito`, {
      replacements: { id_carrito },
      type: QueryTypes.DELETE,
    })

    res.status(200).json({ message: "Producto eliminado del carrito" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al eliminar el producto del carrito" })
  }
}

const actualizarCarrito = async (req, res) => {
  const { id_carrito } = req.params
  const { cantidad } = req.body
  try {
    if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ message: "Cantidad inválida" })
    }

    const item = await sequelize.query(
      `SELECT c.id_carrito, c.id_producto, c.cantidad, p.stock, p.precio AS precio_unitario 
             FROM tbl_carrito_compras c 
             JOIN tbl_productos p ON c.id_producto = p.id 
             WHERE c.id_carrito = :id_carrito`,
      {
        replacements: { id_carrito },
        type: QueryTypes.SELECT,
      },
    )

    if (!item || item.length === 0) {
      return res.status(404).json({ message: "El producto no existe en el carrito" })
    }

    const { id_producto, stock, precio_unitario } = item[0]

    if (stock < cantidad) {
      return res.status(400).json({ message: `Stock insuficiente. Disponible: ${stock}` })
    }

    const precio_total = precio_unitario * cantidad

    await sequelize.query(
      `UPDATE tbl_carrito_compras 
             SET cantidad = :cantidad, precio_total = :precio_total 
             WHERE id_carrito = :id_carrito`,
      {
        replacements: { cantidad, precio_total, id_carrito },
        type: QueryTypes.UPDATE,
      },
    )

    res.status(200).json({ message: "Carrito actualizado correctamente" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al actualizar el carrito" })
  }
}

const comprarCarrito = async (req, res) => {
  const { id_usuario } = req.params
  const { id_transaccion_paypal, metodo_pago = "paypal" } = req.body

  try {
    const transaction = await sequelize.transaction()

    try {
      const productosCarrito = await sequelize.query(
        `SELECT id_carrito, id_producto, cantidad, precio_unitario, precio_total
                 FROM tbl_carrito_compras 
                 WHERE id_usuario = :id_usuario AND estado = 'pendiente'`,
        {
          replacements: { id_usuario },
          type: QueryTypes.SELECT,
          transaction,
        },
      )

      if (!productosCarrito || productosCarrito.length === 0) {
        await transaction.rollback()
        return res.status(400).json({ message: "El carrito está vacío" })
      }

      const totalVenta = productosCarrito.reduce((total, item) => total + Number.parseFloat(item.precio_total), 0)

      const [ventaResult] = await sequelize.query(
        `INSERT INTO tbl_ventas (id_usuario, total_venta, metodo_pago, id_transaccion_paypal)
                 VALUES (:id_usuario, :total_venta, :metodo_pago, :id_transaccion_paypal)`,
        {
          replacements: {
            id_usuario,
            total_venta: totalVenta,
            metodo_pago,
            id_transaccion_paypal,
          },
          type: QueryTypes.INSERT,
          transaction,
        },
      )

      const id_venta = ventaResult

      for (const producto of productosCarrito) {
        await sequelize.query(
          `INSERT INTO tbl_detalle_ventas (id_venta, id_producto, cantidad, precio_unitario, precio_total)
                     VALUES (:id_venta, :id_producto, :cantidad, :precio_unitario, :precio_total)`,
          {
            replacements: {
              id_venta,
              id_producto: producto.id_producto,
              cantidad: producto.cantidad,
              precio_unitario: producto.precio_unitario,
              precio_total: producto.precio_total,
            },
            type: QueryTypes.INSERT,
            transaction,
          },
        )
      }

      await sequelize.query(
        `UPDATE tbl_productos p 
                 JOIN tbl_carrito_compras c ON p.id = c.id_producto 
                 SET p.stock = p.stock - c.cantidad 
                 WHERE c.id_usuario = :id_usuario AND c.estado = 'pendiente'`,
        {
          replacements: { id_usuario },
          type: QueryTypes.UPDATE,
          transaction,
        },
      )

      await notificarAdminsSiStockBajo()

      await sequelize.query(
        `DELETE FROM tbl_carrito_compras 
                 WHERE id_usuario = :id_usuario AND estado = 'pendiente'`,
        {
          replacements: { id_usuario },
          type: QueryTypes.DELETE,
          transaction,
        },
      )

      await transaction.commit()

      res.status(200).json({
        message: "Compra realizada con éxito",
        id_venta,
        total_venta: totalVenta,
        productos_comprados: productosCarrito.length,
      })
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al realizar la compra" })
  }
}

// 🚀 FUNCIÓN OPTIMIZADA PARA MACHINE LEARNING: Dataset para recomendaciones
const obtenerDatasetRecomendaciones = async (req, res) => {
  try {
    const dataset = await sequelize.query(
      `SELECT 
                -- === IDENTIFICADORES PRINCIPALES ===
                v.id_usuario,
                dv.id_producto,
                v.id_venta,
                
                -- === INFORMACIÓN DEL PRODUCTO (ITEM FEATURES) ===
                p.nombre_producto,
                p.imagen as imagen_producto,
                p.descripcion as descripcion_producto,
                p.precio as precio_actual_producto,
                p.categoria_id,
                c.nombre_categoria,
                p.stock as stock_actual,
                
                -- === INFORMACIÓN DE LA INTERACCIÓN (USER-ITEM INTERACTION) ===
                dv.cantidad,
                dv.precio_unitario,
                dv.precio_total as precio_total_producto,
                v.total_venta,
                v.fecha_venta,
                v.metodo_pago,
                
                -- === INFORMACIÓN DEL USUARIO (USER FEATURES) ===
                u.Nombre as nombre_usuario,
                u.Correo as correo_usuario,
                u.Telefono as telefono_usuario,
                CASE 
                    WHEN v.id_usuario BETWEEN 85 AND 89 THEN 'Empresa'
                    ELSE 'Particular'
                END as tipo_usuario,
                
                -- === FEATURES TEMPORALES ===
                YEAR(v.fecha_venta) as año,
                MONTH(v.fecha_venta) as mes,
                DAYOFWEEK(v.fecha_venta) as dia_semana_num,
                DAYNAME(v.fecha_venta) as dia_semana,
                HOUR(v.fecha_venta) as hora,
                QUARTER(v.fecha_venta) as trimestre,
                
                -- === FEATURES CALCULADAS PARA ML ===
                -- Rating implícito basado en cantidad (1-5 scale)
                CASE 
                    WHEN dv.cantidad = 1 THEN 3
                    WHEN dv.cantidad = 2 THEN 4
                    WHEN dv.cantidad >= 3 THEN 5
                    ELSE 2
                END as rating_implicito,
                
                -- Preferencia por precio
                CASE 
                    WHEN dv.precio_unitario > p.precio THEN 5
                    WHEN dv.precio_unitario = p.precio THEN 4
                    WHEN dv.precio_unitario >= (p.precio * 0.9) THEN 3
                    WHEN dv.precio_unitario >= (p.precio * 0.8) THEN 2
                    ELSE 1
                END as preferencia_precio,
                
                -- Intensidad de compra
                CASE 
                    WHEN v.total_venta < 100 THEN 1
                    WHEN v.total_venta BETWEEN 100 AND 299 THEN 2
                    WHEN v.total_venta BETWEEN 300 AND 599 THEN 3
                    WHEN v.total_venta BETWEEN 600 AND 999 THEN 4
                    ELSE 5
                END as intensidad_compra,
                
                -- Estacionalidad
                CASE 
                    WHEN MONTH(v.fecha_venta) IN (12, 1, 2) THEN 'Invierno'
                    WHEN MONTH(v.fecha_venta) IN (3, 4, 5) THEN 'Primavera'
                    WHEN MONTH(v.fecha_venta) IN (6, 7, 8) THEN 'Verano'
                    ELSE 'Otoño'
                END as estacion,
                
                -- Segmento de precio del producto
                CASE 
                    WHEN p.precio < 30 THEN 'Económico'
                    WHEN p.precio BETWEEN 30 AND 100 THEN 'Medio'
                    WHEN p.precio BETWEEN 100 AND 300 THEN 'Premium'
                    ELSE 'Lujo'
                END as segmento_precio,
                
                -- Timestamp para features temporales avanzadas
                UNIX_TIMESTAMP(v.fecha_venta) as timestamp_venta

            FROM tbl_ventas v
            INNER JOIN tbl_usuarios u ON v.id_usuario = u.id_usuarios
            INNER JOIN tbl_detalle_ventas dv ON v.id_venta = dv.id_venta
            INNER JOIN tbl_productos p ON dv.id_producto = p.id
            INNER JOIN tbl_categorias c ON p.categoria_id = c.id
            
            WHERE v.estado_venta = 'completada'
            
            ORDER BY v.fecha_venta DESC, v.id_usuario, dv.id_producto`,
      {
        type: QueryTypes.SELECT,
      },
    )

    const { Parser } = require("json2csv")
    const parser = new Parser()
    const csv = parser.parse(dataset)

    res.header("Content-Type", "text/csv")
    res.attachment("dataset_recomendaciones.csv")
    res.send(csv)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al generar el archivo CSV" })
  }
}

// 🚀 FUNCIÓN ACTUALIZADA: Obtener ventas con detalles (mantiene compatibilidad)
const obtenerVentasConDetalles = async (req, res) => {
  try {
    const ventas = await sequelize.query(
      `SELECT 
                v.id_venta,
                v.id_usuario,
                v.total_venta,
                v.fecha_venta,
                v.estado_venta,
                v.metodo_pago,
                v.id_transaccion_paypal,
                u.Nombre as nombre_usuario,
                u.Correo as correo_usuario,
                u.Telefono as telefono_usuario,
                -- Detalles de productos
                dv.id_detalle,
                dv.id_producto,
                dv.cantidad,
                dv.precio_unitario,
                dv.precio_total as precio_total_producto,
                p.nombre_producto,
                p.imagen as imagen_producto,
                p.descripcion as descripcion_producto
            FROM tbl_ventas v
            INNER JOIN tbl_usuarios u ON v.id_usuario = u.id_usuarios
            INNER JOIN tbl_detalle_ventas dv ON v.id_venta = dv.id_venta
            INNER JOIN tbl_productos p ON dv.id_producto = p.id
            ORDER BY v.fecha_venta DESC, v.id_venta, dv.id_detalle`,
      {
        type: QueryTypes.SELECT,
      },
    )

    // Agrupar resultados por venta
    const ventasAgrupadas = ventas.reduce((acc, row) => {
      const ventaId = row.id_venta

      if (!acc[ventaId]) {
        acc[ventaId] = {
          id_venta: row.id_venta,
          id_usuario: row.id_usuario,
          total_venta: row.total_venta,
          fecha_venta: row.fecha_venta,
          estado_venta: row.estado_venta,
          metodo_pago: row.metodo_pago,
          id_transaccion_paypal: row.id_transaccion_paypal,
          usuario: {
            nombre: row.nombre_usuario,
            correo: row.correo_usuario,
            telefono: row.telefono_usuario,
          },
          productos: [],
        }
      }

      acc[ventaId].productos.push({
        id_detalle: row.id_detalle,
        id_producto: row.id_producto,
        nombre_producto: row.nombre_producto,
        cantidad: row.cantidad,
        precio_unitario: row.precio_unitario,
        precio_total_producto: row.precio_total_producto,
        imagen_producto: row.imagen_producto,
        descripcion_producto: row.descripcion_producto,
      })

      return acc
    }, {})

    const ventasFormateadas = Object.values(ventasAgrupadas)
    res.status(200).json(ventasFormateadas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener las ventas" })
  }
}

// 🚀 FUNCIÓN ACTUALIZADA: CSV optimizado para ML
const { Parser } = require("json2csv")

const descargarVentasCSV = async (req, res) => {
  try {
    const ventas = await sequelize.query(
      `SELECT 
                -- Identificadores
                v.id_usuario,
                dv.id_producto,
                v.id_venta,
                
                -- Información básica
                p.nombre_producto,
                c.nombre_categoria,
                u.Nombre as nombre_usuario,
                u.Correo as correo_usuario,
                
                -- Interacción
                dv.cantidad,
                dv.precio_unitario,
                dv.precio_total as precio_total_producto,
                v.total_venta,
                v.fecha_venta,
                v.metodo_pago,
                
                -- Features para ML
                CASE 
                    WHEN dv.cantidad = 1 THEN 3
                    WHEN dv.cantidad = 2 THEN 4
                    WHEN dv.cantidad >= 3 THEN 5
                    ELSE 2
                END as rating_implicito,
                
                CASE 
                    WHEN v.id_usuario BETWEEN 85 AND 89 THEN 'Empresa'
                    ELSE 'Particular'
                END as tipo_usuario,
                
                CASE 
                    WHEN p.precio < 30 THEN 'Económico'
                    WHEN p.precio BETWEEN 30 AND 100 THEN 'Medio'
                    WHEN p.precio BETWEEN 100 AND 300 THEN 'Premium'
                    ELSE 'Lujo'
                END as segmento_precio
                
            FROM tbl_ventas v
            INNER JOIN tbl_usuarios u ON v.id_usuario = u.id_usuarios
            INNER JOIN tbl_detalle_ventas dv ON v.id_venta = dv.id_venta
            INNER JOIN tbl_productos p ON dv.id_producto = p.id
            INNER JOIN tbl_categorias c ON p.categoria_id = c.id
            WHERE v.estado_venta = 'completada'
            ORDER BY v.fecha_venta DESC`,
      {
        type: QueryTypes.SELECT,
      },
    )

    const parser = new Parser()
    const csv = parser.parse(ventas)

    res.header("Content-Type", "text/csv")
    res.attachment("dataset_recomendaciones.csv")
    res.send(csv)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al generar el archivo CSV" })
  }
}

module.exports = {
  agregarAlCarrito,
  obtenerCarritoPorUsuario,
  eliminarDelCarrito,
  actualizarCarrito,
  comprarCarrito,
  obtenerVentasConDetalles,
  obtenerDatasetRecomendaciones, // 🚀 NUEVA FUNCIÓN PARA ML
  descargarVentasCSV,
}
