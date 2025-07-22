const express = require("express");
const router = express.Router();

// Importar controlador con manejo de errores
let NproductoControllers;
let upload;

try {
  console.log("=== IMPORTANDO CONTROLADOR ===");
  NproductoControllers = require("../controllers/nproductoController");
  console.log("Controlador importado exitosamente");

  console.log("=== IMPORTANDO CLOUDINARY CONFIG ===");
  const cloudinaryConfig = require("../config/cloudinary");
  // Asegúrate de que 'upload' sea correctamente exportado desde cloudinaryConfig
  upload = cloudinaryConfig.upload || {
    single: () => (req, res, next) => {
      res.status(500).json({ mensaje: "Error de configuración de upload" });
    },
  };
  console.log("Upload middleware importado:", typeof upload);

  // Verificar que las funciones del controlador existen
  console.log("Funciones del controlador disponibles:");
  console.log("crearProducto:", typeof NproductoControllers.crearProducto);
  console.log("mostrarProductos:", typeof NproductoControllers.mostrarProductos);
  console.log("actualizarProducto:", typeof NproductoControllers.actualizarProducto);
  console.log("eliminarProducto:", typeof NproductoControllers.eliminarProducto);
} catch (error) {
  console.error("=== ERROR AL IMPORTAR DEPENDENCIAS ===");
  console.error("Error:", error.message);
  console.error("Stack:", error.stack);

  // Crear funciones de fallback
  NproductoControllers = {
    crearProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    mostrarProductos: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerProductosPorCategoria: (req, res) =>
      res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    editarProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    eliminarProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    actualizarProducto: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerProductoPorId: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerCategoriasdecatalogo: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerCategoriasConId: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerCategoriasnuevas: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    productosmasvendidos: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerProductosPorCategoriaDeProducto: (req, res) =>
      res.status(500).json({ mensaje: "Error de configuración del servidor" }),
    obtenerVentasSemanales: (req, res) => res.status(500).json({ mensaje: "Error de configuración del servidor" }),
  };

  // Crear middleware de upload de fallback si no se importa correctamente
  upload = {
    single: () => (req, res, next) => {
      res.status(500).json({ mensaje: "Error de configuración de upload" });
    },
  };
}

// Verificar que upload existe antes de usar
if (!upload || typeof upload.single !== "function") {
  console.error("ERROR: upload.single no está disponible");
  upload = {
    single: () => (req, res, next) => {
      res.status(500).json({ mensaje: "Error de configuración de upload" });
    },
  };
}

// Rutas con middleware de multer para Cloudinary
router.post("/cambios", upload.single("imagen"), NproductoControllers.crearProducto);
router.get("/mostrar", NproductoControllers.mostrarProductos);
router.get("/productos-por-categoria", NproductoControllers.obtenerProductosPorCategoria);
router.put("/editar/:id", upload.single("imagen"), NproductoControllers.editarProducto);
router.delete("/eliminar/:id", NproductoControllers.eliminarProducto);
router.put("/productos/:id", upload.single("imagen"), NproductoControllers.actualizarProducto);
router.get("/producto/:id", NproductoControllers.obtenerProductoPorId);
router.get("/prediccion", NproductoControllers.obtenerCategoriasConId);
router.get("/productosmasvendidos/:categoria_id", NproductoControllers.productosmasvendidos);
router.get("/categorias", NproductoControllers.obtenerCategoriasnuevas);
router.get("/categoriascatalogo", NproductoControllers.obtenerCategoriasdecatalogo);
router.get("/semanas", NproductoControllers.obtenerVentasSemanales);
router.get("/productos/categoria/:id", NproductoControllers.obtenerProductosPorCategoriaDeProducto);

console.log("=== RUTAS CONFIGURADAS EXITOSAMENTE ===");

module.exports = router;