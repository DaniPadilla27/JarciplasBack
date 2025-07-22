const Producto = require("../models/productoModel")
const Categoria = require("../models/categoriasModel")
const Productos = require("../models/index")

// IMPORTACIÓN MEJORADA con debugging
console.log("=== INICIANDO CONTROLADOR ===")
console.log("Importando configuración de Cloudinary...")

try {
  const cloudinaryConfig = require("../config/cloudinary")
  console.log("Cloudinary config importado exitosamente")

  const { uploadToCloudinary, deleteFromCloudinary, extractPublicId } = cloudinaryConfig

  // Verificar que las funciones se importaron correctamente
  console.log("Funciones de Cloudinary importadas:")
  console.log("uploadToCloudinary:", typeof uploadToCloudinary)
  console.log("deleteFromCloudinary:", typeof deleteFromCloudinary)
  console.log("extractPublicId:", typeof extractPublicId)

  const crearProducto = async (req, res) => {
    console.log("=== INICIANDO CREACIÓN DE PRODUCTO ===")
    const { nombre_producto, precio, categoria_id, descripcion, stock } = req.body

    console.table(req.body)
    console.log("Archivo recibido:", req.file ? "Sí" : "No")
    if (req.file) {
      console.log("Detalles del archivo:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer ? req.file.buffer.length : 0,
      })
    }

    // Validación básica
    if (!nombre_producto || !precio || !categoria_id || !descripcion || stock === undefined) {
      return res
        .status(400)
        .json({ mensaje: "Los campos nombre_producto, precio, categoria_id, descripcion y stock son obligatorios" })
    }

    if (isNaN(precio) || precio <= 0) {
      return res.status(400).json({ mensaje: "Precio inválido" })
    }

    if (!req.file) {
      return res.status(400).json({ mensaje: "La imagen es obligatoria" })
    }

    const idcategoria = Number.parseInt(categoria_id)

    try {
      // Buscar la categoría por ID
      console.log("Buscando categoría con ID:", idcategoria)
      const categoria = await Categoria.findOne({ where: { id: idcategoria } })
      if (!categoria) {
        return res.status(404).json({ mensaje: "Categoría no encontrada" })
      }
      console.log("Categoría encontrada:", categoria.nombre_categoria)

      // Verificar que uploadToCloudinary existe antes de usarla
      if (typeof uploadToCloudinary !== "function") {
        console.error("ERROR: uploadToCloudinary no es una función")
        console.error("Tipo actual:", typeof uploadToCloudinary)
        console.error("Valor:", uploadToCloudinary)
        throw new Error("uploadToCloudinary no está disponible")
      }

      // Subir imagen a Cloudinary
      console.log("Subiendo imagen a Cloudinary...")
      console.log("Tamaño del buffer:", req.file.buffer.length)
      console.log("Tipo de archivo:", req.file.mimetype)

      const cloudinaryResult = await uploadToCloudinary(req.file.buffer)
      console.log("Imagen subida exitosamente:", cloudinaryResult.secure_url)

      // Crear el producto con la URL de Cloudinary
      console.log("Creando producto en la base de datos...")
      const nuevoProducto = await Producto.create({
        nombre_producto,
        precio,
        categoria_id: categoria.id,
        imagen: cloudinaryResult.secure_url,
        descripcion,
        stock,
      })

      console.log("Producto creado exitosamente:", nuevoProducto.id)

      res.status(201).json({
        mensaje: "Producto creado exitosamente",
        producto: nuevoProducto,
      })
    } catch (error) {
      console.error("=== ERROR AL CREAR PRODUCTO ===")
      console.error("Mensaje:", error.message)
      console.error("Stack trace:", error.stack)

      res.status(500).json({
        mensaje: "Error al guardar el producto",
        error: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      })
    }
  }

  const actualizarProducto = async (req, res) => {
    const { id } = req.params
    const { nombre_producto, precio, categoria_id, descripcion, stock } = req.body

    console.log("=== ACTUALIZANDO PRODUCTO ===")
    console.log("ID del producto:", id)
    console.table(req.body)

    // Validación básica
    if (!nombre_producto || !precio || !categoria_id || !descripcion || stock === undefined) {
      return res
        .status(400)
        .json({ mensaje: "Los campos nombre_producto, precio, categoria_id, descripcion y stock son obligatorios" })
    }

    if (isNaN(precio) || precio <= 0) {
      return res.status(400).json({ mensaje: "Precio inválido" })
    }

    const idcategoria = Number.parseInt(categoria_id)
    if (isNaN(idcategoria)) {
      return res.status(400).json({ mensaje: "ID de categoría inválido" })
    }

    try {
      // Buscar la categoría por ID
      const categoria = await Categoria.findOne({ where: { id: idcategoria } })
      if (!categoria) {
        return res.status(404).json({ mensaje: "Categoría no encontrada" })
      }

      // Buscar el producto por ID
      const producto = await Producto.findByPk(id)
      if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
      }

      // Guardar la imagen anterior para eliminarla después
      const imagenAnterior = producto.imagen
      let nuevaImagenUrl = imagenAnterior

      // Si se subió una nueva imagen
      if (req.file) {
        console.log("Subiendo nueva imagen a Cloudinary...")
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer)
        nuevaImagenUrl = cloudinaryResult.secure_url
        console.log("Nueva imagen subida:", nuevaImagenUrl)
      }

      // Actualizar los campos del producto
      producto.nombre_producto = nombre_producto
      producto.precio = precio
      producto.categoria_id = categoria.id
      producto.descripcion = descripcion
      producto.stock = stock
      producto.imagen = nuevaImagenUrl

      // Guardar los cambios
      await producto.save()

      // Si se subió una nueva imagen y había una anterior, eliminar la anterior
      if (req.file && imagenAnterior) {
        try {
          const publicId = extractPublicId(imagenAnterior)
          if (publicId) {
            await deleteFromCloudinary(publicId)
            console.log("Imagen anterior eliminada de Cloudinary")
          }
        } catch (cloudinaryError) {
          console.error("Error al eliminar imagen anterior de Cloudinary:", cloudinaryError)
        }
      }

      // Respuesta exitosa
      res.status(200).json({
        mensaje: "Producto actualizado exitosamente",
        producto: {
          id: producto.id,
          nombre_producto: producto.nombre_producto,
          precio: producto.precio,
          categoria: categoria.nombre_categoria,
          descripcion: producto.descripcion,
          stock: producto.stock,
          imagen: producto.imagen,
        },
      })
    } catch (error) {
      console.error("Error al actualizar el producto:", error)
      res.status(500).json({ mensaje: "Error al actualizar el producto", error: error.message })
    }
  }

  const eliminarProducto = async (req, res) => {
    const id = Number.parseInt(req.params.id)

    console.log("=== ELIMINANDO PRODUCTO ===")
    console.log("ID del producto:", id)

    // Validar que el ID sea un número válido
    if (isNaN(id)) {
      return res.status(400).json({ mensaje: "ID de producto inválido" })
    }

    try {
      // Buscar el producto por ID
      const producto = await Producto.findByPk(id)
      if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
      }

      // Guardar la imagen para eliminarla de Cloudinary
      const imagenUrl = producto.imagen

      // Eliminar el producto de la base de datos
      await producto.destroy()

      // Eliminar la imagen de Cloudinary si existe
      if (imagenUrl) {
        try {
          const publicId = extractPublicId(imagenUrl)
          if (publicId) {
            await deleteFromCloudinary(publicId)
            console.log("Imagen eliminada de Cloudinary")
          }
        } catch (cloudinaryError) {
          console.error("Error al eliminar imagen de Cloudinary:", cloudinaryError)
        }
      }

      console.log(`Producto eliminado: ${producto.nombre_producto} (ID: ${id})`)

      // Respuesta exitosa
      res.status(200).json({
        mensaje: "Producto eliminado exitosamente",
        producto: {
          id: producto.id,
          nombre_producto: producto.nombre_producto,
        },
      })
    } catch (error) {
      console.error("Error al eliminar el producto:", error)
      res.status(500).json({ mensaje: "Error al eliminar el producto", error: error.message })
    }
  }

  const editarProducto = async (req, res) => {
    const { id } = req.params
    const { nombre_producto, precio, categoria, descripcion, stock } = req.body

    try {
      const producto = await Producto.findByPk(id)
      if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
      }

      // Guardar la imagen anterior
      const imagenAnterior = producto.imagen
      let nuevaImagenUrl = imagenAnterior

      // Si se subió una nueva imagen
      if (req.file) {
        const cloudinaryResult = await uploadToCloudinary(req.file.buffer)
        nuevaImagenUrl = cloudinaryResult.secure_url
      }

      producto.nombre_producto = nombre_producto || producto.nombre_producto
      producto.precio = precio || producto.precio
      producto.categoria = categoria || producto.categoria
      producto.descripcion = descripcion || producto.descripcion
      producto.stock = stock !== undefined ? stock : producto.stock
      producto.imagen = nuevaImagenUrl

      await producto.save()

      // Eliminar imagen anterior si se subió una nueva
      if (req.file && imagenAnterior) {
        try {
          const publicId = extractPublicId(imagenAnterior)
          if (publicId) {
            await deleteFromCloudinary(publicId)
          }
        } catch (cloudinaryError) {
          console.error("Error al eliminar imagen anterior:", cloudinaryError)
        }
      }

      res.status(200).json({
        mensaje: "Producto actualizado exitosamente",
        producto,
      })
    } catch (error) {
      console.error("Error al editar el producto:", error)
      res.status(500).json({ mensaje: "Error al actualizar el producto" })
    }
  }

  // Mantener las demás funciones igual (solo lectura)
  const mostrarProductos = async (req, res) => {
    try {
      const productos = await Producto.findAll({
        attributes: ["id", "nombre_producto", "precio", "imagen", "descripcion", "stock"],
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre_categoria"],
          },
        ],
      })

      const productosConImagen = productos.map((producto) => ({
        id: producto.id,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio,
        categoria: producto.categoria ? producto.categoria.nombre_categoria : "Sin categoría",
        descripcion: producto.descripcion,
        stock: producto.stock,
        imagen: producto.imagen,
      }))

      res.status(200).json({
        mensaje: "Productos obtenidos correctamente",
        productos: productosConImagen,
      })
    } catch (error) {
      console.error("Error al obtener los productos:", error)
      res.status(500).json({ mensaje: "Error al obtener los productos" })
    }
  }

  const obtenerProductosPorCategoria = async (req, res) => {
    try {
      const productos = await Producto.findAll({
        attributes: ["id", "nombre_producto", "precio", "categoria_id", "imagen", "descripcion", "stock"],
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre"],
          },
        ],
        where: Producto.sequelize.literal(`
          id IN (
            SELECT MIN(p2.id)
            FROM tbl_productos p2
            GROUP BY p2.categoria_id
          )
        `),
      })

      const productosConImagen = productos.map((producto) => ({
        id: producto.id,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio,
        categoria: producto.categoria ? producto.categoria.nombre : "Sin categoría",
        descripcion: producto.descripcion,
        stock: producto.stock,
        imagen: producto.imagen,
      }))

      res.status(200).json({ productos: productosConImagen })
    } catch (error) {
      console.error("Error en la consulta:", error)
      res.status(500).json({ mensaje: "Error al obtener productos", error: error.message })
    }
  }

  const obtenerProductoPorId = async (req, res) => {
    const id = Number.parseInt(req.params.id)
    if (isNaN(id)) {
      return res.status(400).json({ mensaje: "ID de producto inválido" })
    }

    try {
      const producto = await Producto.findByPk(id, {
        attributes: ["id", "nombre_producto", "precio", "imagen", "descripcion", "stock"],
        include: [
          {
            model: Categoria,
            as: "categoria",
            attributes: ["nombre_categoria"],
          },
        ],
      })

      if (!producto) {
        return res.status(404).json({ mensaje: "Producto no encontrado" })
      }

      const productoConImagen = {
        id: producto.id,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio,
        categoria: producto.categoria ? producto.categoria.nombre_categoria : "Sin categoría",
        descripcion: producto.descripcion,
        stock: producto.stock,
        imagen: producto.imagen,
      }

      res.status(200).json({
        mensaje: "Producto obtenido correctamente",
        producto: productoConImagen,
      })
    } catch (error) {
      console.error("Error al obtener el producto:", error)
      res.status(500).json({ mensaje: "Error al obtener el producto", error: error.message })
    }
  }

  // Mantener las demás funciones sin cambios...
  const obtenerCategoriasdecatalogo = async (req, res) => {
    try {
      const categorias = await Productos.Categoria.findAll({
        attributes: ["id", "nombre_categoria"],
        include: [
          {
            model: Productos.Producto,
            as: "productos",
            attributes: ["id", "nombre_producto", "precio", "imagen", "descripcion", "stock"],
          },
        ],
      })

      if (!categorias || categorias.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron categorías" })
      }

      res.status(200).json({
        mensaje: "Categorías obtenidas correctamente",
        categorias,
      })
    } catch (error) {
      console.error("Error al obtener las categorías:", error)
      res.status(500).json({ mensaje: "Error al obtener las categorías", error: error.message })
    }
  }

  const obtenerCategoriasConId = async (req, res) => {
    try {
      const categorias = await Categoria.sequelize.query(
        `
        SELECT 
            c.id AS categoriaId,
            c.nombre_categoria AS categorias,
            COALESCE(SUM(v.cantidad), 0) AS ventasTotales,
            COALESCE(SUM(p.stock), 0) AS stock_inicial,
            COALESCE(SUM(p.stock) - SUM(v.cantidad), 0) AS stock_Restante
        FROM tbl_categorias c
        LEFT JOIN tbl_productos p ON c.id = p.categoria_id
        LEFT JOIN tbl_ventas v ON p.id = v.id_producto
        GROUP BY c.id, c.nombre_categoria
        ORDER BY ventasTotales DESC;
      `,
        { type: Categoria.sequelize.QueryTypes.SELECT },
      )

      if (!categorias || categorias.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron categorías" })
      }

      res.status(200).json({
        mensaje: "Categorías obtenidas correctamente",
        categorias,
      })
    } catch (error) {
      console.error("Error al obtener las categorías:", error)
      res.status(500).json({ mensaje: "Error al obtener las categorías", error: error.message })
    }
  }

  const obtenerCategoriasnuevas = async (req, res) => {
    try {
      const categorias = await Categoria.findAll({
        attributes: ["id", "nombre_categoria"],
      })

      if (!categorias || categorias.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron categorías" })
      }

      res.status(200).json({
        mensaje: "Categorías obtenidas correctamente",
        categorias,
      })
    } catch (error) {
      console.error("Error al obtener las categorías:", error)
      res.status(500).json({ mensaje: "Error al obtener las categorías", error: error.message })
    }
  }

  const productosmasvendidos = async (req, res) => {
    const { categoria_id } = req.params

    try {
      const productos = await Categoria.sequelize.query(
        `
        SELECT 
            p.id,
            p.nombre_producto,
            p.precio,
            p.stock,
            c.nombre_categoria,
            SUM(v.cantidad) AS total_vendido
        FROM tbl_productos p
        JOIN tbl_categorias c ON p.categoria_id = c.id
        JOIN tbl_ventas v ON p.id = v.id_producto
        WHERE p.categoria_id = :categoria_id
        GROUP BY p.id, p.nombre_producto, p.precio, p.stock, c.nombre_categoria
        ORDER BY total_vendido DESC;
      `,
        {
          replacements: { categoria_id },
          type: Categoria.sequelize.QueryTypes.SELECT,
        },
      )

      if (!productos || productos.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron productos para esta categoría" })
      }

      res.status(200).json({
        mensaje: "Productos obtenidos correctamente",
        productos,
      })
    } catch (error) {
      console.error("Error al obtener los productos:", error)
      res.status(500).json({ mensaje: "Error al obtener los productos", error: error.message })
    }
  }

  const obtenerProductosPorCategoriaDeProducto = async (req, res) => {
    const { id } = req.params

    if (isNaN(id)) {
      return res.status(400).json({ mensaje: "ID de categoría inválido" })
    }

    try {
      const productos = await Producto.findAll({
        where: { categoria_id: id },
        attributes: ["id", "nombre_producto", "precio", "imagen", "descripcion", "stock"],
      })

      if (!productos || productos.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron productos para esta categoría" })
      }

      const productosConImagen = productos.map((prod) => ({
        id: prod.id,
        nombre_producto: prod.nombre_producto,
        precio: prod.precio,
        descripcion: prod.descripcion,
        stock: prod.stock,
        imagen: prod.imagen,
      }))

      res.status(200).json({
        mensaje: "Productos de la categoría obtenidos correctamente",
        productos: productosConImagen,
      })
    } catch (error) {
      console.error("Error al obtener los productos por categoría:", error)
      res.status(500).json({ mensaje: "Error al obtener los productos por categoría", error: error.message })
    }
  }

  const obtenerVentasSemanales = async (req, res) => {
    try {
      const ventasSemanales = await Categoria.sequelize.query(
        `
        SELECT 
            YEARWEEK(fecha_venta, 1) AS semana,
            WEEK(fecha_venta, 1) AS numero_semana,
            DATE_FORMAT(MIN(fecha_venta), '%Y-%m-%d') AS inicio_semana,
            DATE_FORMAT(MAX(fecha_venta), '%Y-%m-%d') AS fin_semana,
            COUNT(id_venta) AS total_ventas,
            SUM(cantidad) AS total_productos_vendidos,
            SUM(precio_total) AS total_ingresos,
            AVG(precio_total) AS promedio_venta
        FROM tbl_ventas
        WHERE fecha_venta >= DATE_SUB(CURDATE(), INTERVAL 5 WEEK)
        GROUP BY semana
        ORDER BY semana DESC;
      `,
        {
          type: Categoria.sequelize.QueryTypes.SELECT,
        },
      )

      if (!ventasSemanales || ventasSemanales.length === 0) {
        return res.status(404).json({ mensaje: "No se encontraron datos de ventas semanales" })
      }

      res.status(200).json({
        mensaje: "Datos de ventas semanales obtenidos correctamente",
        ventas: ventasSemanales,
      })
    } catch (error) {
      console.error("Error al obtener las ventas semanales:", error)
      res.status(500).json({ mensaje: "Error al obtener las ventas semanales", error: error.message })
    }
  }

  // VERIFICAR QUE TODAS LAS FUNCIONES ESTÁN DEFINIDAS ANTES DE EXPORTAR
  console.log("=== VERIFICANDO FUNCIONES ANTES DE EXPORTAR ===")
  console.log("crearProducto:", typeof crearProducto)
  console.log("mostrarProductos:", typeof mostrarProductos)
  console.log("obtenerProductosPorCategoria:", typeof obtenerProductosPorCategoria)
  console.log("editarProducto:", typeof editarProducto)
  console.log("eliminarProducto:", typeof eliminarProducto)
  console.log("actualizarProducto:", typeof actualizarProducto)
  console.log("obtenerProductoPorId:", typeof obtenerProductoPorId)
  console.log("obtenerCategoriasdecatalogo:", typeof obtenerCategoriasdecatalogo)
  console.log("obtenerCategoriasConId:", typeof obtenerCategoriasConId)
  console.log("obtenerCategoriasnuevas:", typeof obtenerCategoriasnuevas)
  console.log("productosmasvendidos:", typeof productosmasvendidos)
  console.log("obtenerProductosPorCategoriaDeProducto:", typeof obtenerProductosPorCategoriaDeProducto)
  console.log("obtenerVentasSemanales:", typeof obtenerVentasSemanales)

  module.exports = {
    crearProducto,
    mostrarProductos,
    obtenerProductosPorCategoria,
    editarProducto,
    eliminarProducto,
    actualizarProducto,
    obtenerProductoPorId,
    obtenerCategoriasdecatalogo,
    obtenerCategoriasConId,
    obtenerCategoriasnuevas,
    productosmasvendidos,
    obtenerProductosPorCategoriaDeProducto,
    obtenerVentasSemanales,
  }
} catch (error) {
  console.error("=== ERROR AL IMPORTAR CLOUDINARY ===")
  console.error("Error:", error.message)
  console.error("Stack:", error.stack)

  // Exportar funciones vacías para evitar errores
  module.exports = {
    crearProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    mostrarProductos: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerProductosPorCategoria: (req, res) =>
      res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    editarProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    eliminarProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    actualizarProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerProductoPorId: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerCategoriasdecatalogo: (req, res) =>
      res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerCategoriasConId: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerCategoriasnuevas: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    productosmasvendidos: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerProductosPorCategoriaDeProducto: (req, res) =>
      res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
    obtenerVentasSemanales: (req, res) => res.status(500).json({ mensaje: "Error de configuración de Cloudinary" }),
  }
}
