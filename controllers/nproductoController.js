const Producto = require('../models/productoModel');
const logger = require('../utils/logger');
const Sequelize = require('sequelize');
const crearProducto = async (req, res) => {
  const { nombre_producto, precio, categoria, descripcion, stock } = req.body;
  const imagen = req.file ? req.file.buffer : null;

  if (!nombre_producto || !precio || !categoria || !imagen || !descripcion || stock === undefined) {
    return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
  }

  try {
    const nuevoProducto = await Producto.create({
      nombre_producto,
      precio,
      categoria,
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
    console.error('Error al actualizar el producto:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el producto' });
  }
};

const mostrarProductos = async (req, res) => {
  try {
    const productos = await Producto.findAll({
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion', 'stock'],
    });

    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria,
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
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion', 'stock'],
      where: Producto.sequelize.literal(`
        id IN (
          SELECT MIN(p2.id)
          FROM tbl_productos p2
          GROUP BY p2.categoria
        )
      `),
    });

    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria,
      descripcion: producto.descripcion,
      stock: producto.stock,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
    }));

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
  const { id } = req.params;

  try {
    const producto = await Producto.findByPk(id, {
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion', 'stock'],
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
        stock: producto.stock,
        imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
      },
    });
  } catch (error) {
    console.error('Error al obtener el producto:', error);
    res.status(500).json({ mensaje: 'Error al obtener el producto' });
  }
};

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Producto.findAll({
      attributes: [
        [Producto.sequelize.fn('DISTINCT', Producto.sequelize.col('categoria')), 'categoria']
      ],
    });

    const listaCategorias = categorias.map(categoria => categoria.categoria);

    res.status(200).json({
      mensaje: 'Categorías obtenidas correctamente',
      categorias: listaCategorias,
    });
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ mensaje: 'Error al obtener las categorías' });
  }
  
};


const obtenerProductosDeCategoria = async (req, res) => {
  const { categoria } = req.params;
  const categoriaModificada = categoria.replace(/_/g, ' ');

  try {
    const productos = await Producto.findAll({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('categoria')),
        Sequelize.fn('LOWER', categoriaModificada)
      ),
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion', 'stock'],
    });

    const productosConImagen = productos.map((producto) => ({
      id: producto.id,
      nombre_producto: producto.nombre_producto,
      precio: producto.precio,
      categoria: producto.categoria,
      descripcion: producto.descripcion,
      stock: producto.stock,
      imagen: producto.imagen ? `data:image/jpeg;base64,${producto.imagen.toString('base64')}` : null,
    }));

    res.status(200).json({
      mensaje: 'Productos obtenidos correctamente',
      productos: productosConImagen,
    });
  } catch (error) {
    console.error('Error al obtener los productos por categoría:', error);
    res.status(500).json({ mensaje: 'Error al obtener los productos' });
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
  obtenerCategorias,
  obtenerProductosDeCategoria
};