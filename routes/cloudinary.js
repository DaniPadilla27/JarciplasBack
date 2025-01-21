const { Router } = require("express");
const fileUpload = require("express-fileupload");
const router = Router();

const {
  pruebaSubirImagen,
} = require("../Controllers/cloudinary.Controller.js");

router.post(
  "/pruebaSubirImagen",
  fileUpload({
    useTempFiles: true,
    tempFileDir: "./uploads",
  }),
  pruebaSubirImagen
);

module.exports = router;