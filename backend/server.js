const express = require("express");
const cors = require("cors");
const axios = require("axios");
const csv = require("csvtojson");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// URL pública CSV de tu hoja de cálculo
const GOOGLE_SHEETS_CSV_URL = process.env.GOOGLE_SHEETS_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOulzUrUEuRTG3Xj1v3WbF8BPO2Hc-Y9PwCTSO794qyRdMgcDLEs6y2hbYQkBo76eCGace9zjMvZm9/pub?gid=0&single=true&output=csv";

app.get("/", (req, res) => {
    res.json({ mensaje: "API Backend ejecutándose en la nube", estado: "Online" });
});

// Reto 3: Endpoint de Estado del Servicio
app.get("/api/estado", (req, res) => {
    res.json({
        estado: "Online",
        servidor: "Node.js",
        servicio: "Cloud API",
        version: "1.0"
    });
});

// Endpoint de Productos
app.get("/api/productos", async (req, res) => {
    try {
        const response = await axios.get(GOOGLE_SHEETS_CSV_URL);

        // Convertir CSV a JSON normalizando las llaves (convirtiendo encabezados a minúsculas y sin espacios extras)
        const jsonArray = await csv().fromString(response.data);

        console.log("Datos del CSV recibidos:", jsonArray);

        const productosLimpios = jsonArray.map((item, index) => {
            // Normalizar claves del objeto para evitar problemas con tildes o espacios
            const normalizedItem = {};
            Object.keys(item).forEach((key) => {
                normalizedItem[key.trim().toLowerCase()] = item[key];
            });

            const id = normalizedItem.id || index + 1;
            const nombre =
                normalizedItem.titulo ||
                normalizedItem["título"] ||
                normalizedItem.nombre ||
                normalizedItem.videojuego ||
                "Sin nombre";

            const precio = normalizedItem.precio || "0";

            const categoria =
                normalizedItem.categoria ||
                normalizedItem["categoría"] ||
                normalizedItem.genero ||
                normalizedItem["género"] ||
                normalizedItem.plataforma ||
                "General";

            const stock = normalizedItem.stock || "0";

            return { id, nombre, precio, categoria, stock };
        }).filter(p => p.nombre !== "Sin nombre");

        res.json(productosLimpios);
    } catch (error) {
        console.error("Error leyendo Google Sheets:", error);
        res.status(500).json({ error: "Error al obtener datos de Google Sheets" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});