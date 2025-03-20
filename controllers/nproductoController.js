const Producto = require('../models/productoModel');
const logger = require('../utils/logger'); // Importar el logger


const crearProducto = async (req, res) => {
  const { nombre_producto, precio, categoria, descripcion } = req.body;
  const imagen = req.file ? req.file.buffer : null; // Captura la imagen

  // Validar que todos los campos estén presentes
  if (!nombre_producto || !precio || !categoria || !imagen || !descripcion) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    // Guarda el producto en la base de datos
    const nuevoProducto = await Producto.create({
      nombre_producto,
      precio,
      categoria,
      imagen, // Guarda la imagen como BLOB
      descripcion,
    });

    res.status(201).json({
      mensaje: 'Producto creado exitosamente',
      producto: nuevoProducto,
    });
  } catch (error) {
    conloggersole.error('Error al crear el producto:', error);
    res.status(500).json({ mensaje: 'Error al guardar el producto' });
  }
};
const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre_producto, precio, categoria, descripcion } = req.body;
  const imagen = req.file ? req.file.buffer : null; // Captura la nueva imagen si se proporciona

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Actualiza los campos del producto
    producto.nombre_producto = nombre_producto || producto.nombre_producto;
    producto.precio = precio || producto.precio;
    producto.categoria = categoria || producto.categoria;
    producto.descripcion = descripcion || producto.descripcion;
    if (imagen) {
      producto.imagen = imagen; // Solo actualiza la imagen si se proporciona una nueva
    }

    await producto.save(); // Guarda los cambios en la base de datos

    res.status(200).json({
      mensaje: 'Producto actualizado exitosamente',
      producto,
    });
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto' });
  }
};






const mostrarProductos = async (req, res) => {
  try {
    logger.info('Iniciando consulta a la base de datos...'); // Usar 'info' en lugar de 'log'
    const productos = await Producto.findAll({
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen','descripcion'],
    });

    if (!productos.length) {
      logger.warn('No se encontraron productos.'); // Usar 'warn' para mensajes de advertencia
      return res.status(404).json({ mensaje: 'No hay productos disponibles.' });
    }

    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null, 
      descripcion: producto.descripcion,

    }));

    logger.info('Productos obtenidos:', productosConImagen); // Usar 'info' en lugar de 'log'
    res.status(200).json({
      mensaje: 'Productos obtenidos correctamente',
      productos: productosConImagen,
    });
  } catch (error) {
    logger.error('Error al obtener los productos:', error); // Asegúrate de que 'error' esté definido
    res.status(500).json({
      mensaje: 'Error al obtener los productos, inténtelo nuevamente más tarde.',
    });
  }
};

const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion'],
      where: Producto.sequelize.literal(`
        id IN (
          SELECT MIN(p2.id)
          FROM tbl_productos p2
          GROUP BY p2.categoria
        )
      `),
    });

    // Convertir la imagen a Base64
    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria,
      descripcion: producto.descripcion,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null, 
    }));

    // 🔍 Verificar en la consola del backend si las imágenes están presentes
    logger.log('Productos obtenidos:', productosConImagen.map(p => ({
      id: p.id,
      nombre: p.nombre_producto,
      imagen: p.imagen ? '✅ Imagen presente' : '❌ Sin imagen'
    })));

    res.json({ productos: productosConImagen }); 
  } catch (error) {
    logger.error('Error en la consulta:', error);
    res.status(500).json({ mensaje: 'Error al obtener productos', error: error.message });
  }
};
const eliminarProducto = async (req, res) => {
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    await producto.destroy();

    res.status(200).json({
      mensaje: 'Producto eliminado exitosamente',
    });
  } catch (error) {
    console.error('Error al eliminar el producto:', error);
    res.status(500).json({ mensaje: 'Error al eliminar el producto' });
  }
};

const editarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre_producto, precio, categoria, descripcion } = req.body;
  const imagen = req.file ? req.file.buffer : null; // Captura la nueva imagen si se proporciona

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    // Actualiza los campos del producto
    producto.nombre_producto = nombre_producto || producto.nombre_producto;
    producto.precio = precio || producto.precio;
    producto.categoria = categoria || producto.categoria;
    producto.descripcion = descripcion || producto.descripcion;
    if (imagen) {
      producto.imagen = imagen; // Actualiza la imagen solo si se proporciona una nueva
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
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id, {
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion'],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Producto obtenido correctamente',
      producto: {
        id: producto.id,
        nombre_producto: producto.nombre_producto,
        precio: producto.precio,
        categoria: producto.categoria,
        descripcion: producto.descripcion,
        imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
      },
    });
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ mensaje: 'Error al obtener el producto' });
  }
};





module.exports = {
    crearProducto,
    mostrarProductos,
    obtenerProductosPorCategoria,
    editarProducto,
    eliminarProducto,
    actualizarProducto,
    obtenerProductoPorId
};
