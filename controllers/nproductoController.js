const Producto = require('../models/productoModel');
const logger = require('../utils/logger'); // Importar el logger


const crearProducto = async (req, res) => {
  const { nombre_producto, precio, categoria,descripcion } = req.body;
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
      descripcion
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

const mostrarProductos = async (req, res) => {
  try {
    logger.log('Iniciando consulta a la base de datos...');
    const productos = await Producto.findAll({
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen','descripcion'], // Incluye la imagen
    });

    if (!productos.length) {
      logger.log('No se encontraron productos.');
      return res.status(404).json({ mensaje: 'No hay productos disponibles.' });
    }

    // Convierte el buffer de la imagen a Base64 para enviarlo en la respuesta
    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria,
      descripcion: producto.descripcion,
      imagen: producto.imagen ? producto.imagen.toString('base64') : null, // Convertir a Base64
      
    }));

    logger.log('Productos obtenidos:', productosConImagen);
    res.status(200).json({
      mensaje: 'Productos obtenidos correctamente',
      productos: productosConImagen,
    });
  } catch (error) {
    logger.error('Error al obtener los productos:', error);
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




module.exports = {
    crearProducto,
    mostrarProductos,
    obtenerProductosPorCategoria
};