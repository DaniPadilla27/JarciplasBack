const Producto = require('../models/productoModel');
const Categoria = require('../models/categoriasModel');


// Definir relaciones
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id', as: 'categoria' });
Categoria.hasMany(Producto, { foreignKey: 'categoria_id', as: 'productos' });

module.exports = { Categoria, Producto };
