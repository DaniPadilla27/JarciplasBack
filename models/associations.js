const Categoria = require('./categoriasModel');
const Producto = require('./productosModel');

// Definir relaciones
Categoria.hasMany(Producto, { foreignKey: 'categoria_id' });
Producto.belongsTo(Categoria, { foreignKey: 'categoria_id' });

// Exportar los modelos ya relacionados
module.exports = { Categoria, Producto };
