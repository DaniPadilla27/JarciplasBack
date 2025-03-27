const Producto = require('../models/productoModel');
const logger = require('../utils/logger');
const Categoria = require('../models/categoriasModel');
const Productos = require('../models/index');



const crearProducto = async (req, res) => {
  const { nombre_producto, precio, categoria_id, descripcion, stock } = req.body;
  const imagen = req.file ? req.file.buffer : null;
  console.table(req.body)
  // Validación básica
  if (!nombre_producto || !precio || !categoria_id || !descripcion || stock === undefined) {
    return res.status(400).json({ mensaje: 'Los campos nombre_producto, precio, categoria_id, descripcion y stock son obligatorios' });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ mensaje: 'Precio inválido' });
  }
  let idcategoria = parseInt(categoria_id);
  try {
    // Buscar la categoría por ID
    const categoria = await Categoria.findOne({ where: { id: idcategoria } });
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    } else {
      console.log(categoria)
    }

    // Crear el producto
    const nuevoProducto = await Producto.create({
      nombre_producto,
      precio,
      categoria_id: categoria.id, // Usar el nombre de la categoría
      imagen,
      descripcion,
      stock,
    });

    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: nuevoProducto,
    });
  } catch (error) {
    console.error('Error al crear el producto:', error);
    res.status(500).json({ mensaje: 'Error al guardar el producto' });
  }
};
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre_producto, precio, categoria_id, descripcion, stock } = req.body;
  const imagen = req.file ? req.file.buffer : null;

  // Validación básica
  if (!nombre_producto || !precio || !categoria_id || !descripcion || stock === undefined) {
    return res.status(400).json({ mensaje: 'Los campos nombre_producto, precio, categoria_id, descripcion y stock son obligatorios' });
  }

  if (isNaN(precio) || precio <= 0) {
    return res.status(400).json({ mensaje: 'Precio inválido' });
  }

  const idcategoria = parseInt(categoria_id);
  if (isNaN(idcategoria)) {
    return res.status(400).json({ mensaje: 'ID de categoría inválido' });
  }

  try {
    // Buscar la categoría por ID
    const categoria = await Categoria.findOne({ where: { id: idcategoria } });
    if (!categoria) {
      return res.status(404).json({ mensaje: 'Categoría no encontrada' });
    }

    // Buscar el producto por ID
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Actualizar los campos del producto
    producto.nombre_producto = nombre_producto;
    producto.precio = precio;
    producto.categoria_id = categoria.id;
    producto.descripcion = descripcion;
    producto.stock = stock;
    if (imagen) {
      producto.imagen = imagen;
    }

    // Guardar los cambios
    await producto.save();

    // Respuesta exitosa
    res.status(200).json({
      mensaje: 'Producto actualizado exitosamente',
      producto: {
        id: producto.id,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio,
        categoria: categoria.nombre_categoria,
        descripcion: producto.descripcion,
        stock: producto.stock,
        imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
      },
    });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto', error: error.message });
  }
};

const mostrarProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      attributes: ['id', 'nombre_producto', 'precio', 'imagen', 'descripcion', 'stock'],
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['nombre_categoria'], // Solo el nombre de la categoría
      }],
    });

    // Convertir la imagen BLOB a Base64 si existe
    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria ? producto.categoria.nombre_categoria : 'Sin categoría',
      descripcion: producto.descripcion,
      stock: producto.stock,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
    }));

    res.status(200).json({
      mensaje: 'Productos obtenidos correctamente',
      productos: productosConImagen,
    });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los productos' });
  }
};


const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      attributes: ['id', 'nombre_producto', 'precio', 'categoria_id', 'imagen', 'descripcion', 'stock'],
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['nombre']
      }],
      where: Producto.sequelize.literal(`
        id IN (
          SELECT MIN(p2.id)
          FROM tbl_productos p2
          GROUP BY p2.categoria_id
        )
      `),
    });

    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria ? producto.categoria.nombre : 'Sin categoría',
      descripcion: producto.descripcion,
      stock: producto.stock,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
    }));

    console.log('Productos obtenidos:', productosConImagen.map(p => ({
      id: p.id,
      nombre: p.nombre_producto,
      imagen: p.imagen ? '✅ Imagen presente' : '❌ Sin imagen'
    })));

    res.status(200).json({ productos: productosConImagen });
  } catch (error) {
    console.error('Error en la consulta:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};


const eliminarProducto = async (req, res) => {
  const id = parseInt(req.params.id);

  // Validar que el ID sea un número válido
  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID de producto inválido' });
  }

  try {
    // Buscar el producto por ID
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Eliminar el producto
    await producto.destroy();

    console.log(`Producto eliminado: ${producto.nombre_producto} (ID: ${id})`);

    // Respuesta exitosa
    res.status(200).json({
      mensaje: 'Producto eliminado exitosamente',
      producto: {
        id: producto.id,
        nombre_producto: producto.nombre_producto,
      },
    });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el producto', error: error.message });
  }
};


const editarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre_producto, precio, categoria, descripcion, stock } = req.body;
  const imagen = req.file ? req.file.buffer : null;

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    producto.nombre_producto = nombre_producto || producto.nombre_producto;
    producto.precio = precio || producto.precio;
    producto.categoria = categoria || producto.categoria;
    producto.descripcion = descripcion || producto.descripcion;
    producto.stock = stock !== undefined ? stock : producto.stock;
    if (imagen) {
      producto.imagen = imagen;
    }

    await producto.save();

    res.status(200).json({
      mensaje: 'Producto actualizado exitosamente',
      producto,
    });
  } catch (error) {
    console.error('Error al editar el producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto' });
  }
};

const obtenerProductoPorId = async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID de producto inválido' });
  }

  try {
    const producto = await Producto.findByPk(id, {
      attributes: ['id', 'nombre_producto', 'precio', 'imagen', 'descripcion', 'stock'],
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['nombre_categoria'], // Solo el nombre de la categoría
      }],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Convertir la imagen BLOB a Base64 si existe
    const productoConImagen = {
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria ? producto.categoria.nombre_categoria : 'Sin categoría',
      descripcion: producto.descripcion,
      stock: producto.stock,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
    };

    console.log('Producto encontrado:', productoConImagen);

    res.status(200).json({
      mensaje: 'Producto obtenido correctamente',
      producto: productoConImagen,
    });
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
  }
};


const obtenerCategoriasdecatalogo = async (req, res) => {
  try {
    const categorias = await Productos.Categoria.findAll({
      attributes: ['id', 'nombre_categoria'],
      include: [
        {
          model: Productos.Producto,
          as: 'productos', // Asegúrate de que coincida con el alias en la relación
          attributes: ['id', 'nombre_producto', 'precio', 'imagen', 'descripcion', 'stock'],
        }
      ]
    });

    if (!categorias || categorias.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron categorías' });
    }

    res.status(200).json({
      mensaje: 'Categorías obtenidas correctamente',
      categorias,
    });
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ mensaje: 'Error al obtener las categorías', error: error.message });
  }
};



const obtenerCategoriasConId = async (req, res) => {
  try {
    const categorias = await Categoria.sequelize.query(`
      SELECT 
          c.nombre_categoria AS categorias,
          COALESCE(SUM(v.cantidad), 0) AS ventasTotales,
          COALESCE(SUM(p.stock), 0) AS stock_inicial,
          COALESCE(SUM(p.stock) - SUM(v.cantidad), 0) AS stock_Restante
      FROM tbl_categorias c
      LEFT JOIN tbl_productos p ON c.id = p.categoria_id
      LEFT JOIN tbl_ventas v ON p.id = v.id_producto
      GROUP BY c.id, c.nombre_categoria
      ORDER BY ventasTotales DESC;
    `, { type: Categoria.sequelize.QueryTypes.SELECT });

    if (!categorias || categorias.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron categorías' });
    }

    res.status(200).json({
      mensaje: 'Categorías obtenidas correctamente',
      categorias,
    });
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ mensaje: 'Error al obtener las categorías', error: error.message });
  }
};
const obtenerCategoriasnuevas = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      attributes: ['id', 'nombre_categoria'], // Selecciona solo los campos necesarios
    });

    if (!categorias || categorias.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron categorías' });
    }

    res.status(200).json({
      mensaje: 'Categorías obtenidas correctamente',
      categorias,
    });
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ mensaje: 'Error al obtener las categorías', error: error.message });
  }
};
const productosmasvendidos = async (req, res) => {
  const { categoria_id } = req.params; // Obtener el ID de la categoría desde los parámetros de la URL

  try {
    const productos = await Categoria.sequelize.query(`
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
    `, {
      replacements: { categoria_id }, // Reemplazar el parámetro en la consulta
      type: Categoria.sequelize.QueryTypes.SELECT,
    });

    if (!productos || productos.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron productos para esta categoría' });
    }

    res.status(200).json({
      mensaje: 'Productos obtenidos correctamente',
      productos,
    });
  } catch (error) {
    console.error('Error al obtener los productos:', error);
    res.status(500).json({ mensaje: 'Error al obtener los productos', error: error.message });
  }
};

const obtenerProductosPorCategoriaDeProducto = async (req, res) => {
  const { id } = req.params; // Aquí `id` será el `categoria_id`

  console.log('Categoria ID recibido:', id);

  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID de categoría inválido' });
  }

  try {
    // Buscar todos los productos que pertenezcan a la categoría
    const productos = await Producto.findAll({
      where: { categoria_id: id },
      attributes: ['id', 'nombre_producto', 'precio', 'imagen', 'descripcion', 'stock'],
    });

    if (!productos || productos.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron productos para esta categoría' });
    }

    // Convertir las imágenes BLOB a Base64 si existen
    const productosConImagen = productos.map((prod) => ({
      id: prod.id,
      nombre_producto: prod.nombre_producto,
      precio: prod.precio,
      descripcion: prod.descripcion,
      stock: prod.stock,
      imagen: prod.imagen ? `data:image/jpeg;base64,${prod.imagen.toString('base64')}` : null,
    }));

    res.status(200).json({
      mensaje: 'Productos de la categoría obtenidos correctamente',
      productos: productosConImagen,
    });
  } catch (error) {
    console.error('Error al obtener los productos por categoría:', error);
    res.status(500).json({ mensaje: 'Error al obtener los productos por categoría', error: error.message });
  }
};




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

};