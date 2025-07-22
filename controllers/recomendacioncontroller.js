const fs = require('fs');
const path = require('path');

// Leer el archivo de reglas de asociación
const reglas = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../utils/reglas_asociacion.json'), 'utf8')
);


// Controlador que devuelve recomendaciones según el producto
const obtenerRecomendaciones = (req, res) => {
  const producto = req.query.producto?.toLowerCase();
  

  if (!producto) {
    return res.status(400).json({ error: "Debes proporcionar un nombre de producto." });
  }

  console.log("🔍 Buscando recomendaciones para:", producto);

  const recomendaciones = reglas.filter(rule =>
    rule.antecedents.map(p => p.toLowerCase()).includes(producto)
  );

  console.log("📊 Total recomendaciones encontradas:", recomendaciones.length);
  console.log("📋 Reglas encontradas:", recomendaciones);

  if (recomendaciones.length === 0) {
    return res.status(404).json({ mensaje: "No se encontraron recomendaciones para este producto." });
  }

  res.json(recomendaciones.slice(0, 5));
};


module.exports = {
  obtenerRecomendaciones
};