const Producto = require('../models/productoModel');

const crearProducto = async (req, res) => {
    try {
        const { nombre_producto, precio, categoria } = req.body;

        // Validación de datos
        if (!nombre_producto || !precio || !categoria) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }

        // Crear producto en la base de datos
        const nuevoProducto = await Producto.create({
            nombre_producto,
            precio,
            categoria,
        });

        // Respuesta de éxito
        res.status(201).json({
            mensaje: 'Producto creado correctamente',
            producto: nuevoProducto,
        });
    } catch (error) {
        console.error('Error al crear el producto:', error);

        // Respuesta en caso de error
        res.status(500).json({
            mensaje: 'Error al crear el producto, inténtelo nuevamente más tarde.',
        });
    }
};
const mostrarProductos = async (req, res) => {
    try {
        console.log('Iniciando consulta a la base de datos...');
        const productos = await Producto.findAll({
            attributes: ['id', 'nombre_producto', 'precio', 'categoria'],
        });

        if (!productos.length) {
            console.log('No se encontraron productos.');
            return res.status(404).json({ mensaje: 'No hay productos disponibles.' });
        }

        console.log('Productos obtenidos:', productos);
        res.status(200).json({
            mensaje: 'Productos obtenidos correctamente',
            productos,
        });
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        res.status(500).json({
            mensaje: 'Error al obtener los productos, inténtelo nuevamente más tarde.',
        });
    }
};



module.exports = {
    crearProducto,
    mostrarProductos
};
