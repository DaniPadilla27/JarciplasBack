const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { Readable } = require("stream");

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar multer para memoria
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"), false);
    }
  },
});

// Función para subir a Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: "productos",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 800, height: 600, crop: "limit" }, { quality: "auto" }],
      public_id: `producto_${Date.now()}_${Math.round(Math.random() * 1e9)}`,
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error("Error en Cloudinary upload:", error);
        reject(error);
      } else {
        console.log("Cloudinary upload exitoso:", result.secure_url);
        resolve(result);
      }
    });

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
};

// Función para eliminar de Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    console.log("Eliminando de Cloudinary:", publicId);
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Resultado eliminación:", result);
    return result;
  } catch (error) {
    console.error("Error al eliminar imagen de Cloudinary:", error);
    throw error;
  }
};

// Función para extraer public_id
const extractPublicId = (imageUrl) => {
  if (!imageUrl) return null;
  try {
    const parts = imageUrl.split("/");
    const filename = parts[parts.length - 1];
    const publicId = filename.split(".")[0];
    return `productos/${publicId}`;
  } catch (error) {
    console.error("Error al extraer public_id:", error);
    return null;
  }
};

// Exportar todas las funciones y el middleware
module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicId,
};