const express = require("express");
const cors = require("cors");
const axios = require("axios");
const csv = require("csvtojson");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const GOOGLE_SHEETS_CSV_URL = process.env.GOOGLE_SHEETS_CSV_URL || "https://docs.google.com/spreadsheets/d/e/2PACX-1vQOulzUrUEuRTG3Xj1v3WbF8BPO2Hc-Y9PwCTSO794qyRdMgcDLEs6y2hbYQkBo76eCGace9zjMvZm9/pub?gid=0&single=true&output=csv";

app.get("/", (req, res) => {
    res.json({ mensaje: "API Backend ejecutándose en la nube", estado: "Online" });
});

app.get("/api/estado", (req, res) => {
    res.json({
        estado: "Online",
        servidor: "Node.js",
        servicio: "Cloud API",
        version: "1.0"
    });
});

app.get("/api/productos", async (req, res) => {
    try {
        const response = await axios.get(GOOGLE_SHEETS_CSV_URL);
        const jsonArray = await csv().fromString(response.data);

        const productosLimpios = jsonArray.map((item, index) => {
            // Normalizar las llaves del CSV a minúsculas
            const normalizedItem = {};
            Object.keys(item).forEach((key) => {
                normalizedItem[key.trim().toLowerCase()] = item[key];
            });

            const id = normalizedItem.id || index + 1;
            
            // Buscar nombre por titulo o nombre
            const nombre = normalizedItem.titulo || normalizedItem["título"] || normalizedItem.nombre || "Videojuego";
            const precio = normalizedItem.precio || "0";
            
            // Asignar categoría combinando plataforma y genero si existen
            const categoria = normalizedItem.plataforma || normalizedItem.genero || normalizedItem["género"] || normalizedItem.categoria || "General";
            const stock = normalizedItem.stock || "0";

            return { id, nombre, precio, categoria, stock };
        });

        res.json(productosLimpios);
    } catch (error) {
        console.error("Error leyendo Google Sheets:", error);
        res.status(500).json({ error: "Error al obtener datos de Google Sheets" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});