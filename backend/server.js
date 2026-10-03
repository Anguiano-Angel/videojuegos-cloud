const express = require("express");
const cors = require("cors");
const axios = require("axios");
const csv = require("csvtojson");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURACIÓN DE CLOUDINARY
// =====================================================

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// =====================================================
// CONFIGURACIÓN DE MULTER
// =====================================================

// La imagen se guarda temporalmente en memoria.
// NO se guarda en el disco del servidor.
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"));
    }
  }
});

// =====================================================
// GOOGLE SHEETS
// =====================================================

const GOOGLE_SHEETS_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbzUt7niiyQJ2_csZQpJIAeUQnOC63im6n1aA_5P99g5W7F_kDlnZQA115iAeywbPRTMeA/exec";

// =====================================================
// RUTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {
  res.json({
    mensaje: "API Backend ejecutándose en la nube",
    estado: "Online"
  });
});

// =====================================================
// RETO 3: ENDPOINT DE ESTADO
// =====================================================

app.get("/api/estado", (req, res) => {
  res.json({
    estado: "Online",
    servidor: "Node.js",
    servicio: "Cloud API",
    version: "1.0"
  });
});

// =====================================================
// SUBIR IMAGEN A CLOUDINARY
// =====================================================

app.post("/api/upload", upload.single("imagen"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No se subió ningún archivo de imagen"
      });
    }

    // Subir el archivo directamente desde memoria a Cloudinary
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "videojuegos"
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      stream.end(req.file.buffer);
    });

    console.log("Imagen subida correctamente a Cloudinary:");
    console.log(resultado.secure_url);

    res.json({
      status: "success",
      urlImagen: resultado.secure_url
    });

  } catch (error) {
    console.error("Error al subir imagen a Cloudinary:", error);

    res.status(500).json({
      error: "Error al subir la imagen",
      detalles: error.message
    });
  }
});

// =====================================================
// READ: CONSULTAR VIDEOJUEGOS
// =====================================================

app.get("/api/productos", async (req, res) => {
  try {
    const response = await axios.get(GOOGLE_SHEETS_URL);

    let jsonArray = [];

    // Apps Script devuelve JSON
    if (
      typeof response.data === "object" &&
      Array.isArray(response.data)
    ) {
      jsonArray = response.data;

    // Compatibilidad con CSV
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

      const plataforma =
        normalizedItem.plataforma || "N/A";

      const genero =
        normalizedItem.genero ||
        normalizedItem["género"] ||
        "General";

      const categoria =
        normalizedItem.categoria ||
        plataforma ||
        genero;

      const precio =
        normalizedItem.precio || "0";

      const stock =
        normalizedItem.stock || "0";

      const imagen =
        normalizedItem.imagen ||
        normalizedItem.urlimagen ||
        normalizedItem["url_imagen"] ||
        "";

      return {
        id,
        nombre,
        plataforma,
        genero,
        categoria,
        precio,
        stock,
        imagen
      };
    });

    res.json(productosLimpios);

  } catch (error) {

    console.error(
      "Error consultando Google Sheets:",
      error.message
    );

    res.status(500).json({
      error: "Error al obtener datos de Google Sheets",
      detalles: error.message
    });
  }
});

// =====================================================
// CREATE: CREAR VIDEOJUEGO
// =====================================================

app.post("/api/productos", async (req, res) => {
  try {

    const {
      titulo,
      plataforma,
      genero,
      precio,
      stock,
      imagen
    } = req.body;

    if (GOOGLE_SHEETS_URL.includes("script.google.com")) {

      const response = await axios.post(
        GOOGLE_SHEETS_URL,
        {
          action: "create",
          titulo,
          plataforma,
          genero,
          precio,
          stock,
          imagen
        }
      );

      return res.json(response.data);
    }

    res.json({
      status: "success",
      message: "Registro recibido en modo de prueba"
    });

  } catch (error) {

    console.error(
      "Error al crear:",
      error.message
    );

    res.status(500).json({
      error: "No se pudo guardar el registro"
    });
  }
});

// =====================================================
// UPDATE: EDITAR VIDEOJUEGO
// =====================================================

app.put("/api/productos/:id", async (req, res) => {
  try {

    const { id } = req.params;

    const {
      titulo,
      plataforma,
      genero,
      precio,
      stock,
      imagen
    } = req.body;

    if (GOOGLE_SHEETS_URL.includes("script.google.com")) {

      const response = await axios.post(
        GOOGLE_SHEETS_URL,
        {
          action: "update",
          id,
          titulo,
          plataforma,
          genero,
          precio,
          stock,
          imagen
        }
      );

      return res.json(response.data);
    }

    res.json({
      status: "updated",
      id
    });

  } catch (error) {

    console.error(
      "Error al actualizar:",
      error.message
    );

    res.status(500).json({
      error: "No se pudo actualizar el registro"
    });
  }
});

// =====================================================
// DELETE: ELIMINAR VIDEOJUEGO
// =====================================================

app.delete("/api/productos/:id", async (req, res) => {
  try {

    const { id } = req.params;

    if (GOOGLE_SHEETS_URL.includes("script.google.com")) {

      const response = await axios.post(
        GOOGLE_SHEETS_URL,
        {
          action: "delete",
          id
        }
      );

      return res.json(response.data);
    }

    res.json({
      status: "deleted",
      id
    });

  } catch (error) {

    console.error(
      "Error al eliminar:",
      error.message
    );

    res.status(500).json({
      error: "No se pudo eliminar el registro"
    });
  }
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(
    `Servidor escuchando en el puerto ${PORT}`
  );
});
