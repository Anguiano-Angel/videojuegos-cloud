const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Reemplaza esto con la URL del Web App de tu Google Apps Script que copiaste en el Paso 1:
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOulzUrUEuRTG3Xj1v3WbF8BPO2Hc-Y9PwCTSO794qyRdMgcDLEs6y2hbYQkBo76eCGace9zjMvZm9/pub?gid=0&single=true&output=csv";

app.get("/", (req, res) => {
  res.json({ mensaje: "API Backend ejecutándose en la nube", estado: "Online" });
});

// Reto 3: Endpoint de Estado
app.get("/api/estado", (req, res) => {
  res.json({
    estado: "Online",
    servidor: "Node.js",
    servicio: "Cloud API",
    version: "1.0"
  });
});

// READ: Obtener videojuegos
app.get("/api/productos", async (req, res) => {
  try {
    const response = await axios.get(GOOGLE_APPS_SCRIPT_URL);
    const data = response.data;

    const productosLimpios = data.map((item, index) => ({
      id: item.id || index + 1,
      nombre: item.titulo || item.nombre || "Videojuego",
      plataforma: item.plataforma || "N/A",
      genero: item.genero || "General",
      categoria: item.plataforma || item.genero || "General",
      precio: item.precio || "0",
      stock: item.stock || "0"
    }));

    res.json(productosLimpios);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al consultar Google Sheets" });
  }
});

// CREATE: Crear videojuego
app.post("/api/productos", async (req, res) => {
  try {
    const { titulo, plataforma, genero, precio, stock } = req.body;
    const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, {
      action: "create",
      titulo,
      plataforma,
      genero,
      precio,
      stock
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error al crear registro:", error);
    res.status(500).json({ error: "Error al guardar en Google Sheets" });
  }
});

// UPDATE: Modificar videojuego
app.put("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, plataforma, genero, precio, stock } = req.body;
    const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, {
      action: "update",
      id,
      titulo,
      plataforma,
      genero,
      precio,
      stock
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error al actualizar registro:", error);
    res.status(500).json({ error: "Error al actualizar en Google Sheets" });
  }
});

// DELETE: Eliminar videojuego
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.post(GOOGLE_APPS_SCRIPT_URL, {
      action: "delete",
      id
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error al eliminar registro:", error);
    res.status(500).json({ error: "Error al borrar de Google Sheets" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor activo en el puerto ${PORT}`);
});