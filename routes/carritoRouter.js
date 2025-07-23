const express = require("express")
const {
  agregarAlCarrito,
  obtenerCarritoPorUsuario,
  eliminarDelCarrito,
  actualizarCarrito,
  comprarCarrito,
  obtenerVentasConDetalles,
  obtenerDatasetRecomendaciones, // 🚀 NUEVA RUTA PARA ML
  descargarVentasCSV,
} = require("../controllers/carrito")

const router = express.Router()

// Rutas existentes
router.post("/carrito", agregarAlCarrito)
router.get("/carrito/:id_usuario", obtenerCarritoPorUsuario)
router.delete("/carrito/:id_carrito", eliminarDelCarrito)
router.put("/carrito/:id_carrito", actualizarCarrito)
router.post("/comprar/:id_usuario", comprarCarrito)
router.get("/ventas", obtenerVentasConDetalles)
router.get("/ventas/csv", descargarVentasCSV)

// 🚀 NUEVA RUTA: Dataset optimizado para machine learning
router.get("/dataset/recomendaciones", obtenerDatasetRecomendaciones)

module.exports = router
