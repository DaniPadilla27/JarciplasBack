const TipoInformacion = require('../models/tipoInformacionEmpresaModel');

// Obtener todos los tipos de información
const obtenerTiposInformacion = async (req, res) => {
  try {
    const tiposInformacion = await TipoInformacion.findAll();
    res.json(tiposInformacion);
  } catch (error) {
    console.error('Error al obtener los tipos de información:', error);
    res.status(500).json({ message: 'Error interno al obtener los tipos de información' });
  }
};

// Crear un nuevo tipo de información
const crearTipoInformacion = async (req, res) => {
  const { tipo } = req.body;

  try {
    if (!tipo) {
      return res.status(400).json({ message: 'El campo tipo es requerido.' });
    }

    const nuevoTipoInformacion = await TipoInformacion.create({ tipo });
    res.status(201).json(nuevoTipoInformacion);
  } catch (error) {
    console.error('Error al crear el tipo de información:', error);
    res.status(500).json({ message: 'Error interno al crear el tipo de información', error: error.message });
  }
};

module.exports = {
  obtenerTiposInformacion,
  crearTipoInformacion,
};

