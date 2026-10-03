const express = require("express");
const cors = require("cors");
const axios = require("axios");
const csv = require("csvtojson");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// URL por defecto
const GOOGLE_SHEETS_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzUt7niiyQJ2_csZQpJIAeUQnOC63im6n1aA_5P99g5W7F_kDlnZQA115iAeywbPRTMeA/exec";

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

// READ: Consulta de Productos (Soporta JSON directo de Apps Script y CSV tradicional)
app.get("/api/productos", async (req, res) => {
  try {
    const response = await axios.get(GOOGLE_SHEETS_URL);
    let jsonArray = [];

    // Validar si la respuesta es un Objeto JSON (Apps Script) o texto CSV
    if (typeof response.data === "object" && Array.isArray(response.data)) {
      jsonArray = response.data;
    } else if (typeof response.data === "string") {
      jsonArray = await csv().fromString(response.data);
    }

    const productosLimpios = jsonArray.map((item, index) => {
      const normalizedItem = {};
      Object.keys(item).forEach((key) => {
        normalizedItem[key.trim().toLowerCase()] = item[key];
      });

      const id = normalizedItem.id || index + 1;
      const nombre =
        normalizedItem.titulo ||
        normalizedItem["título"] ||
        normalizedItem.nombre ||
        "Sin título";

      const plataforma = normalizedItem.plataforma || "N/A";
      const genero = normalizedItem.genero || normalizedItem["género"] || "General";
      const categoria = normalizedItem.categoria || plataforma || genero;
      const precio = normalizedItem.precio || "0";
      const stock = normalizedItem.stock || "0";

      return { id, nombre, plataforma, genero, categoria, precio, stock };
    });

    res.json(productosLimpios);
  } catch (error) {
    console.error("Error consultando Google Sheets:", error.message);
    res.status(500).json({ error: "Error al obtener datos de Google Sheets", detalles: error.message });
  }
});

// CREATE: Crear
app.post("/api/productos", async (req, res) => {
  try {
    const { titulo, plataforma, genero, precio, stock } = req.body;
    if (GOOGLE_SHEETS_URL.includes("script.google.com")) {
      const response = await axios.post(GOOGLE_SHEETS_URL, {
        action: "create",
        titulo,
        plataforma,
        genero,
        precio,
        stock
      });
      return res.json(response.data);
    }
    res.json({ status: "success", message: "Registro recibido en modo de prueba" });
  } catch (error) {
    console.error("Error al crear:", error.message);
    res.status(500).json({ error: "No se pudo guardar el registro" });
  }
});

// UPDATE: Editar
app.put("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, plataforma, genero, precio, stock } = req.body;
    if (GOOGLE_SHEETS_URL.includes("script.google.com")) {
      const response = await axios.post(GOOGLE_SHEETS_URL, {
        action: "update",
        id,
        titulo,
        plataforma,
        genero,
        precio,
        stock
      });
      return res.json(response.data);
    }
    res.json({ status: "updated", id });
  } catch (error) {
    console.error("Error al actualizar:", error.message);
    res.status(500).json({ error: "No se pudo actualizar el registro" });
  }
});

// DELETE: Eliminar
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (GOOGLE_SHEETS_URL.includes("script.google.com")) {
      const response = await axios.post(GOOGLE_SHEETS_URL, {
        action: "delete",
        id
      });
      return res.json(response.data);
    }
    res.json({ status: "deleted", id });
  } catch (error) {
    console.error("Error al eliminar:", error.message);
    res.status(500).json({ error: "No se pudo eliminar el registro" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});