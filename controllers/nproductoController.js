const Producto = require('../models/productoModel');
const logger = require('../utils/logger');
const Categoria = require('../models/categoriasModel');



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

  let idcategoria = parseInt(categoria_id);
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
      attributes: ['id', 'nombre_producto', 'precio', 'categoria_id', 'imagen', 'descripcion', 'stock'],
      include: [{
        model: Categoria,
        as: 'categoria',
        attributes: ['nombre']
      }]
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

  if (isNaN(id)) {
    return res.status(400).json({ mensaje: 'ID de producto inválido' });
  }

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    console.log(`Eliminando producto: ${producto.nombre_producto} (ID: ${id})`);
    
    await producto.destroy();

    res.status(200).json({
      mensaje: 'Producto eliminado exitosamente',
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
      attributes: ['id', 'nombre_producto', 'precio', 'categoria', 'imagen', 'descripcion', 'stock'],
    });

    if (!producto) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    console.log('Producto encontrado:', producto.toJSON());

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
    res.status(500).json({ mensaje: 'Error al obtener el producto', error: error.message });
  }
};


const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Producto.findAll({
      attributes: [
        [Producto.sequelize.fn('DISTINCT', Producto.sequelize.col('categoria')), 'categoria']
      ],
      raw: true, // Evita estructura innecesaria en el resultado
    });

    if (!categorias || categorias.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron categorías' });
    }

    const listaCategorias = categorias.map(categoria => categoria.categoria);

    console.log('Categorías obtenidas:', listaCategorias);

    res.status(200).json({
      mensaje: 'Categorías obtenidas correctamente',
      categorias: listaCategorias,
    });
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ mensaje: 'Error al obtener las categorías', error: error.message });
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
  obtenerCategorias

};