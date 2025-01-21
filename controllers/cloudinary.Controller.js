// Importamos nuestras funciones personalizadas (CRUD)
const { v2: cloudinary } = require("cloudinary");
const { deleteImage, uploadImage } = require("../cloudinary/cloudinary");
const Configu = require('../models/tipoInformacionEmpresaModel');
const fs = require("fs-extra");

// Función de prueba para subir imágenes
exports.pruebaSubirImagen = async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ mensaje: "No se proporcionaron imágenes para subir" });
    }

    const imagenes = [];
    const fileKeys = Object.keys(req.files);

    // Procesa y sube cada archivo
    for (const key of fileKeys) {
      const file = req.files[key];

      // Verifica que el archivo sea una imagen
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']; // Tipos permitidos
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ mensaje: `El archivo ${file.name} no es una imagen válida` });
      }

      try {
        const result = await uploadImage(file.tempFilePath || file.path);
        imagenes.push({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
        await fs.unlink(file.tempFilePath || file.path); // Elimina el archivo temporal después de subirlo
      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        return res.status(500).json({ mensaje: "Error al procesar una de las imágenes" });
      }
    }

    // Aquí puedes realizar una consulta para obtener la información de la empresa
    const empresa = await Configu.findById(req.params.id); // ejemplo de consulta, ajustar según tu lógica de negocio
    if (!empresa) {
      return res.status(404).json({ mensaje: "Empresa no encontrada" });
    }

    // Si se quiere asociar las imágenes a la empresa
    empresa.img = imagenes;  // Asocia las imágenes a la empresa
    await empresa.save(); // Guarda los cambios

    console.log("todo correcto");
    res.status(200).json({ mensaje: "Imágenes subidas correctamente", imagenes });
  } catch (error) {
    console.error("Error del servidor:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};
