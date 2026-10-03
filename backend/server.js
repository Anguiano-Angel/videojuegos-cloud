const express = require("express");
const cors = require("cors");
const axios = require("axios");
const csv = require("csvtojson");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Reemplaza esta URL por la URL pública CSV de tu NUEVA hoja de cálculo:
const GOOGLE_SHEETS_CSV_URL = process.env.GOOGLE_SHEETS_CSV_URL || "https://docs.google.com/spreadsheets/d/1lZz04ck6eyYn5tyLkIPSYbNyx4GKSMZ610AmZXpvFUc/edit?usp=sharing";

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

        const jsonArray = await csv().fromString(response.data);

        const productosLimpios = jsonArray.map((item, index) => {
            const id = item.ID || item.id || item.field2 || index + 1;
            const nombre = item.Nombre || item.nombre || item.field3 || "Sin nombre";
            const precio = item.Precio || item.precio || item.field4 || "0";
            const categoria = item.Categoría || item.Categoria || item.categoria || item.field5 || "General";
            const stock = item.Stock || item.stock || item.field6 || "0";

            return { id, nombre, precio, categoria, stock };
        }).filter(p => p.nombre !== "Nombre" && p.nombre !== "Sin nombre");

        res.json(productosLimpios);
    } catch (error) {
        console.error("Error leyendo Google Sheets:", error);
        res.status(500).json({ error: "Error al obtener datos de Google Sheets" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en puerto ${PORT}`);
});