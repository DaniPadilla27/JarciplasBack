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
                p.unidad_medida,
                p.categoria_id,
                c.nombre_categoria,
                p.stock as stock_actual,
                
                -- === INFORMACIÓN DE LA INTERACCIÓN (USER-ITEM INTERACTION) ===
                dv.cantidad,
                dv.precio_unitario,
                dv.precio_total as precio_total_producto,
                v.total_venta,
                v.costo_envio,  -- 🚀 CAMPO AGREGADO
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
                
                -- === INFORMACIÓN DE DIRECCIÓN ===
                d.calle,
                d.numero_exterior,
                d.numero_interior,
                d.colonia,
                d.codigo_postal,
                d.ciudad,
                d.estado,
                d.municipio,
                d.pais,
                d.referencias,
                CONCAT(d.calle, ' ', d.numero_exterior,
                       CASE WHEN d.numero_interior IS NOT NULL 
                            THEN CONCAT(' Int. ', d.numero_interior) 
                            ELSE '' END,
                       ', ', d.colonia) as direccion_completa,
                
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
                
                -- Segmentación geográfica
                CASE 
                    WHEN d.estado = 'Hidalgo' THEN 'Regional'
                    WHEN d.estado = 'Veracruz' THEN 'Regional'
                    WHEN d.estado = 'CDMX' THEN 'Metropolitano'
                    ELSE 'Nacional'
                END as segmento_geografico,
                
                -- Tipo de unidad de medida
                CASE 
                    WHEN p.unidad_medida LIKE '%L%' OR p.unidad_medida LIKE '%ml%' THEN 'Líquido'
                    WHEN p.unidad_medida LIKE '%g%' OR p.unidad_medida LIKE '%kg%' THEN 'Sólido'
                    WHEN p.unidad_medida LIKE '%pz%' OR p.unidad_medida LIKE '%ud%' THEN 'Unitario'
                    ELSE 'Otro'
                END as tipo_unidad,
                
                -- Timestamp para features temporales avanzadas
                UNIX_TIMESTAMP(v.fecha_venta) as timestamp_venta
                
            FROM tbl_ventas v
            INNER JOIN tbl_usuarios u ON v.id_usuario = u.id_usuarios
            INNER JOIN tbl_detalle_ventas dv ON v.id_venta = dv.id_venta
            INNER JOIN tbl_productos p ON dv.id_producto = p.id
            INNER JOIN tbl_categorias c ON p.categoria_id = c.id
            LEFT JOIN tbl_direcciones d ON u.id_usuarios = d.id_usuario 
                AND d.es_principal = TRUE 
                AND d.activo = TRUE
                
            WHERE v.estado_venta = 'completada'
            ORDER BY v.fecha_venta DESC, v.id_usuario, dv.id_producto`,
      {
        type: QueryTypes.SELECT,
      }
    )

    const { Parser } = require("json2csv")
    const parser = new Parser()
    const csv = parser.parse(dataset)

    res.header("Content-Type", "text/csv")
    res.attachment("dataset_recomendaciones_completo.csv")
    res.send(csv)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al generar el archivo CSV" })
  }
}

// 🚀 FUNCIÓN ACTUALIZADA: Obtener ventas con detalles completos (todos los datos como dataset)
const obtenerVentasConDetalles = async (req, res) => {
  try {
    const ventas = await sequelize.query(
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
                p.unidad_medida,
                p.categoria_id,
                c.nombre_categoria,
                p.stock as stock_actual,
                
                -- === INFORMACIÓN DE LA INTERACCIÓN (USER-ITEM INTERACTION) ===
                dv.id_detalle,
                dv.cantidad,
                dv.precio_unitario,
                dv.precio_total as precio_total_producto,
                v.total_venta,
                v.costo_envio,  -- 🚀 NUEVO CAMPO AGREGADO
                v.fecha_venta,
                v.estado_venta,
                v.metodo_pago,
                v.id_transaccion_paypal,
                
                -- === INFORMACIÓN DEL USUARIO (USER FEATURES) ===
                u.Nombre as nombre_usuario,
                u.Correo as correo_usuario,
                u.Telefono as telefono_usuario,
                CASE 
                    WHEN v.id_usuario BETWEEN 85 AND 89 THEN 'Empresa'
                    ELSE 'Particular'
                END as tipo_usuario,
                
                -- === INFORMACIÓN DE DIRECCIÓN ===
                d.calle,
                d.numero_exterior,
                d.numero_interior,
                d.colonia,
                d.codigo_postal,
                d.ciudad,
                d.estado,
                d.municipio,
                d.pais,
                d.referencias,
                CONCAT(d.calle, ' ', d.numero_exterior,
                       CASE WHEN d.numero_interior IS NOT NULL 
                            THEN CONCAT(' Int. ', d.numero_interior) 
                            ELSE '' END,
                       ', ', d.colonia) as direccion_completa,
                
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
                
                -- Intensidad de compra (ahora incluye costo de envío)
                CASE 
                    WHEN (v.total_venta + COALESCE(v.costo_envio, 0)) < 100 THEN 1
                    WHEN (v.total_venta + COALESCE(v.costo_envio, 0)) BETWEEN 100 AND 299 THEN 2
                    WHEN (v.total_venta + COALESCE(v.costo_envio, 0)) BETWEEN 300 AND 599 THEN 3
                    WHEN (v.total_venta + COALESCE(v.costo_envio, 0)) BETWEEN 600 AND 999 THEN 4
                    ELSE 5
                END as intensidad_compra,
                
                -- 🚀 NUEVO: Categoría de costo de envío
                CASE 
                    WHEN v.costo_envio <= 30 THEN 'Económico'
                    WHEN v.costo_envio BETWEEN 31 AND 50 THEN 'Medio'
                    WHEN v.costo_envio BETWEEN 51 AND 70 THEN 'Alto'
                    WHEN v.costo_envio > 70 THEN 'Premium'
                    ELSE 'Sin definir'
                END as categoria_costo_envio,
                
                -- 🚀 NUEVO: Porcentaje del envío respecto al total
                CASE 
                    WHEN v.total_venta > 0 THEN ROUND((COALESCE(v.costo_envio, 0) / v.total_venta) * 100, 2)
                    ELSE 0
                END as porcentaje_envio_total,
                
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
                
                -- Segmentación geográfica
                CASE 
                    WHEN d.estado = 'Hidalgo' THEN 'Regional'
                    WHEN d.estado = 'Veracruz' THEN 'Regional'
                    WHEN d.estado = 'CDMX' THEN 'Metropolitano'
                    ELSE 'Nacional'
                END as segmento_geografico,
                
                -- Tipo de unidad de medida
                CASE 
                    WHEN p.unidad_medida LIKE '%L%' OR p.unidad_medida LIKE '%ml%' THEN 'Líquido'
                    WHEN p.unidad_medida LIKE '%g%' OR p.unidad_medida LIKE '%kg%' THEN 'Sólido'
                    WHEN p.unidad_medida LIKE '%pz%' OR p.unidad_medida LIKE '%ud%' THEN 'Unitario'
                    ELSE 'Otro'
                END as tipo_unidad,
                
                -- Timestamp para features temporales avanzadas
                UNIX_TIMESTAMP(v.fecha_venta) as timestamp_venta
                
            FROM tbl_ventas v
            INNER JOIN tbl_usuarios u ON v.id_usuario = u.id_usuarios
            INNER JOIN tbl_detalle_ventas dv ON v.id_venta = dv.id_venta
            INNER JOIN tbl_productos p ON dv.id_producto = p.id
            INNER JOIN tbl_categorias c ON p.categoria_id = c.id
            LEFT JOIN tbl_direcciones d ON u.id_usuarios = d.id_usuario 
                AND d.es_principal = TRUE 
                AND d.activo = TRUE
                
            WHERE v.estado_venta = 'completada'
            ORDER BY v.fecha_venta DESC, v.id_usuario, dv.id_producto`,
      {
        type: QueryTypes.SELECT,
      }
    )

    // Agrupar resultados por venta para mantener estructura organizada
    const ventasAgrupadas = ventas.reduce((acc, row) => {
      const ventaId = row.id_venta
      
      if (!acc[ventaId]) {
        acc[ventaId] = {
          // Información básica de la venta
          id_venta: row.id_venta,
          id_usuario: row.id_usuario,
          total_venta: row.total_venta,
          costo_envio: row.costo_envio,  // 🚀 NUEVO CAMPO AGREGADO
          fecha_venta: row.fecha_venta,
          estado_venta: row.estado_venta,
          metodo_pago: row.metodo_pago,
          id_transaccion_paypal: row.id_transaccion_paypal,
          
          // Información del usuario
          usuario: {
            nombre: row.nombre_usuario,
            correo: row.correo_usuario,
            telefono: row.telefono_usuario,
            tipo_usuario: row.tipo_usuario,
          },
          
          // Información de dirección
          direccion: {
            calle: row.calle,
            numero_exterior: row.numero_exterior,
            numero_interior: row.numero_interior,
            colonia: row.colonia,
            codigo_postal: row.codigo_postal,
            ciudad: row.ciudad,
            estado: row.estado,
            municipio: row.municipio,
            pais: row.pais,
            referencias: row.referencias,
            direccion_completa: row.direccion_completa,
            segmento_geografico: row.segmento_geografico,
          },
          
          // Features temporales
          features_temporales: {
            año: row.año,
            mes: row.mes,
            dia_semana_num: row.dia_semana_num,
            dia_semana: row.dia_semana,
            hora: row.hora,
            trimestre: row.trimestre,
            estacion: row.estacion,
            timestamp_venta: row.timestamp_venta,
          },
          
          // Features de ML para la venta (incluyendo nuevos campos de envío)
          features_ml: {
            intensidad_compra: row.intensidad_compra,
            categoria_costo_envio: row.categoria_costo_envio,  // 🚀 NUEVO
            porcentaje_envio_total: row.porcentaje_envio_total,  // 🚀 NUEVO
          },
          
          // 🚀 NUEVA SECCIÓN: Información de envío
          envio: {
            costo: row.costo_envio,
            categoria: row.categoria_costo_envio,
            porcentaje_del_total: row.porcentaje_envio_total,
          },
          
          // Array de productos
          productos: [],
        }
      }

      // Agregar producto con toda su información
      acc[ventaId].productos.push({
        // Información básica del producto
        id_detalle: row.id_detalle,
        id_producto: row.id_producto,
        nombre_producto: row.nombre_producto,
        imagen_producto: row.imagen_producto,
        descripcion_producto: row.descripcion_producto,
        precio_actual_producto: row.precio_actual_producto,
        unidad_medida: row.unidad_medida,
        stock_actual: row.stock_actual,
        
        // Información de categoría
        categoria_id: row.categoria_id,
        nombre_categoria: row.nombre_categoria,
        
        // Información de la compra
        cantidad: row.cantidad,
        precio_unitario: row.precio_unitario,
        precio_total_producto: row.precio_total_producto,
        
        // Features ML del producto
        features_ml: {
          rating_implicito: row.rating_implicito,
          preferencia_precio: row.preferencia_precio,
          segmento_precio: row.segmento_precio,
          tipo_unidad: row.tipo_unidad,
        },
      })

      return acc
    }, {})

    const ventasFormateadas = Object.values(ventasAgrupadas)

    res.status(200).json({
      total_ventas: ventasFormateadas.length,
      total_productos_vendidos: ventas.length,
      resumen_envios: {
        costo_promedio_envio: ventas.length > 0 ? 
          (ventas.reduce((sum, v) => sum + (v.costo_envio || 0), 0) / ventas.filter(v => v.costo_envio).length).toFixed(2) : 0,
        total_costos_envio: ventas.reduce((sum, v) => sum + (v.costo_envio || 0), 0).toFixed(2),
      },
      ventas: ventasFormateadas,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Error al obtener las ventas con detalles completos" })  }
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
