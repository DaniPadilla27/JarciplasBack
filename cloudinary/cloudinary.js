const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: 'dyh36u4qk', 
    api_key: '632176825211746', 
  api_secret: 'lp1wLelLPv1mCwCL2MsN_d2do9k',
  secure: true,
});

//Funcion para subir archivos a cloudinary
async function uploadImage(filePath) {
  return await cloudinary.uploader.upload(filePath, {
    folder: 'imgjarcipal',
    crop: "limit",
  });
}

//funcion para eliminar imagenes
async function deleteImage(publicId) {
  return await cloudinary.uploader.destroy(publicId);
}

module.exports = { uploadImage, deleteImage };