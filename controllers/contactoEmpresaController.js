const Contacto = require('../models/contactoEmpresa');

// Crear nuevo contacto
const crearContacto = async (req, res) => {
  const { nombre, informacion } = req.body; // Cambiado a 'nombre'
  console.log('Datos recibidos:', req.body); // Agregar esto
  try {
    const nuevoContacto = await Contacto.create({ nombre, informacion }); // Cambiado a 'nombre'
    res.status(201).json({ message: 'Contacto creado correctamente', id: nuevoContacto.id_contacto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear el contacto' });
  }
};
 
// Consultar todos los contactos
const obtenerContactos = async (req, res) => {
  try {
    const contactos = await Contacto.findAll();
    res.status(200).json(contactos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener contactos' });
  }
};

// Actualizar un contacto
const actualizarContacto = async (req, res) => {
  const { id } = req.params;
  const { nombre, informacion } = req.body; // Cambiado a 'nombre'

  try {
    const [updated] = await Contacto.update(
      { nombre, informacion }, // Cambiado a 'nombre'
      { where: { id_contacto: id } }
    );

    if (updated) {
      res.status(200).json({ message: 'Contacto actualizado correctamente' });
    } else {
      res.status(404).json({ message: 'Contacto no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el contacto' });
  }
};

// Borrar un contacto
const borrarContacto = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Contacto.destroy({ where: { id_contacto: id } });

    if (deleted) {
      res.status(200).json({ message: 'Contacto borrado correctamente' });
    } else {
      res.status(404).json({ message: 'Contacto no encontrado' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al borrar el contacto' });
  }
};

module.exports = {
  crearContacto,
  obtenerContactos,
  actualizarContacto,
  borrarContacto,
};
