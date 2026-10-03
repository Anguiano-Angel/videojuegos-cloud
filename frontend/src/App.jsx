import { useEffect, useState } from "react";
import "./App.css";

// Opciones predefinidas de Plataformas (Sin 'Multiplataforma' para el selector de creación)
const LISTA_PLATAFORMAS = [
  "PlayStation 1",
  "PlayStation 2",
  "PlayStation 3",
  "PlayStation 4",
  "PlayStation 5",
  "XBOX Clásico",
  "XBOX 360",
  "XBOX One",
  "XBOX Series X/S",
  "PC (Steam)",
  "Nintendo GameCube",
  "Nintendo Wii",
  "Nintendo Wii U",
  "Nintendo Switch",
  "Nintendo Switch 2"
];

function App() {
  // Estado de Autenticación (Login)
  const [autenticado, setAutenticado] = useState(false);
  const [credenciales, setCredenciales] = useState({ usuario: "", password: "" });
  const [errorLogin, setErrorLogin] = useState("");

  // Estado de Productos y API
  const [productos, setProductos] = useState([]);
  const [estadoServicio, setEstadoServicio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorAPI, setErrorAPI] = useState(false);

  // Estados de Filtros Separados y Ordenamiento
  const [busqueda, setBusqueda] = useState("");
  const [generoSeleccionado, setGeneroSeleccionado] = useState("Todos");
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState("Todas");
  const [ordenamiento, setOrdenamiento] = useState("nombre-asc");

  // Estados del Formulario (Crear / Editar)
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  
  // Modificado: plataformasSeleccionadas es un Array
  const [formData, setFormData] = useState({
    titulo: "",
    plataformasSeleccionadas: ["PlayStation 5"],
    genero: "",
    precio: "",
    stock: ""
  });

  const API_URL = import.meta.env.VITE_API_URL || "https://videojuegos-backend-api.onrender.com";

  // Manejador de Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (credenciales.usuario === "admin" && credenciales.password === "12345") {
      setAutenticado(true);
      setErrorLogin("");
    } else {
      setErrorLogin("Credenciales incorrectas. (Prueba: admin / 12345)");
    }
  };

  // Cargar Datos
  const cargarDatos = () => {
    setCargando(true);
    const fetchProductos = fetch(`${API_URL}/api/productos`).then((res) => res.json());
    const fetchEstado = fetch(`${API_URL}/api/estado`).then((res) => res.json());

    Promise.all([fetchProductos, fetchEstado])
      .then(([dataProductos, dataEstado]) => {
        setProductos(Array.isArray(dataProductos) ? dataProductos : []);
        setEstadoServicio(dataEstado);
        setCargando(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorAPI(true);
        setCargando(false);
      });
  };

  useEffect(() => {
    if (autenticado) {
      cargarDatos();
    }
  }, [autenticado]);

  // Manejo de Selección Múltiple de Plataformas en el Formulario
  const togglePlataforma = (plat) => {
    setFormData((prev) => {
      const existe = prev.plataformasSeleccionadas.includes(plat);
      if (existe) {
        // Evitar dejar vacío el array
        if (prev.plataformasSeleccionadas.length === 1) return prev;
        return {
          ...prev,
          plataformasSeleccionadas: prev.plataformasSeleccionadas.filter((p) => p !== plat)
        };
      } else {
        return {
          ...prev,
          plataformasSeleccionadas: [...prev.plataformasSeleccionadas, plat]
        };
      }
    });
  };

  // VALIDACIÓN DE FORMULARIO
  const validarFormulario = () => {
    if (!formData.titulo.trim()) {
      alert("⚠️ El título del juego es obligatorio.");
      return false;
    }
    if (formData.plataformasSeleccionadas.length === 0) {
      alert("⚠️ Debes seleccionar al menos una plataforma.");
      return false;
    }
    if (!formData.genero.trim()) {
      alert("⚠️ Ingresa al menos un género.");
      return false;
    }
    const precioNum = parseFloat(formData.precio);
    if (isNaN(precioNum) || precioNum <= 0) {
      alert("⚠️ Por favor ingresa un precio válido mayor a 0.");
      return false;
    }
    const stockNum = parseInt(formData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      alert("⚠️ El stock debe ser un número entero igual o mayor a 0.");
      return false;
    }
    return true;
  };

  // Guardar (Crear o Editar)
  const handleGuardar = (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    // Convertimos el array de plataformas a una cadena separada por comas para enviar al backend/Google Sheets
    const payload = {
      titulo: formData.titulo,
      plataforma: formData.plataformasSeleccionadas.join(", "),
      genero: formData.genero,
      precio: formData.precio,
      stock: formData.stock
    };

    const endpoint = modoEdicion
      ? `${API_URL}/api/productos/${idEditando}`
      : `${API_URL}/api/productos`;

    const metodo = modoEdicion ? "PUT" : "POST";

    fetch(endpoint, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then(() => {
        alert(modoEdicion ? "¡Registro actualizado!" : "¡Videojuego creado con éxito!");
        resetForm();
        cargarDatos();
      })
      .catch(() => alert("Error al guardar el registro."));
  };

  // Preparar Edición
  const handleEditar = (p) => {
    setModoEdicion(true);
    setIdEditando(p.id);

    // Convertir la cadena de plataformas a array
    const platString = p.plataforma || "";
    const arrayPlats = platString
      .split(",")
      .map((item) => item.trim())
      .filter((item) => LISTA_PLATAFORMAS.includes(item));

    setFormData({
      titulo: p.nombre,
      plataformasSeleccionadas: arrayPlats.length > 0 ? arrayPlats : ["PlayStation 5"],
      genero: p.genero || p.categoria || "",
      precio: p.precio,
      stock: p.stock
    });
  };

  // Eliminar
  const handleEliminar = (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este videojuego de Google Sheets?")) {
      fetch(`${API_URL}/api/productos/${id}`, { method: "DELETE" })
        .then((res) => res.json())
        .then(() => {
          alert("Registro eliminado.");
          cargarDatos();
        })
        .catch(() => alert("Error al eliminar."));
    }
  };

  const resetForm = () => {
    setModoEdicion(false);
    setIdEditando(null);
    setFormData({
      titulo: "",
      plataformasSeleccionadas: ["PlayStation 5"],
      genero: "",
      precio: "",
      stock: ""
    });
  };

  // Obtener géneros dinámicos e independientes separando cadenas con comas (Ej. "FPS, Acción")
  const generosDisponibles = [
    "Todos",
    ...new Set(
      productos
        .flatMap((p) => {
          const raw = p.genero || p.categoria || "";
          return raw.split(",").map((g) => g.trim());
        })
        .filter(Boolean)
    )
  ];

  // 1. Filtrado combinado (Nombre, Múltiples Géneros y Múltiples Plataformas)
  const productosFiltrados = productos.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const generoRaw = (p.genero || p.categoria || "").toLowerCase();
    const listaGenerosJuego = generoRaw.split(",").map((g) => g.trim());

    const plataformaRaw = (p.plataforma || "").toLowerCase();
    const listaPlataformasJuego = plataformaRaw.split(",").map((plat) => plat.trim());

    // Búsqueda por Nombre
    const coincideNombre = nombre.includes(busqueda.toLowerCase());

    // Coincidencia por Género
    const coincideGenero =
      generoSeleccionado === "Todos" ||
      listaGenerosJuego.includes(generoSeleccionado.toLowerCase());

    // Coincidencia por Plataforma
    let coincidePlataforma = false;
    if (plataformaSeleccionada === "Todas") {
      coincidePlataforma = true;
    } else if (plataformaSeleccionada === "Multiplataforma") {
      // Lógica especial: Es Multiplataforma si tiene 2 o más plataformas asociadas
      coincidePlataforma = listaPlataformasJuego.length >= 2;
    } else {
      coincidePlataforma = listaPlataformasJuego.includes(plataformaSeleccionada.toLowerCase());
    }

    return coincideNombre && coincideGenero && coincidePlataforma;
  });

  // 2. Ordenamiento Dinámico
  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    const nombreA = (a.nombre || "").toLowerCase();
    const nombreB = (b.nombre || "").toLowerCase();
    const precioA = parseFloat(a.precio) || 0;
    const precioB = parseFloat(b.precio) || 0;

    if (ordenamiento === "nombre-asc") return nombreA.localeCompare(nombreB);
    if (ordenamiento === "nombre-desc") return nombreB.localeCompare(nombreA);
    if (ordenamiento === "precio-asc") return precioA - precioB;
    if (ordenamiento === "precio-desc") return precioB - precioA;
    return 0;
  });

  // PANTALLA DE LOGIN
  if (!autenticado) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h2 style={styles.loginTitle}>☁️ Acceso al Sistema Cloud</h2>
          <p style={styles.loginSubtitle}>Ingresa tus credenciales para administrar el catálogo</p>
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Usuario:</label>
              <input
                type="text"
                style={styles.input}
                value={credenciales.usuario}
                onChange={(e) => setCredenciales({ ...credenciales, usuario: e.target.value })}
                placeholder="Ej. admin"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña:</label>
              <input
                type="password"
                style={styles.input}
                value={credenciales.password}
                onChange={(e) => setCredenciales({ ...credenciales, password: e.target.value })}
                placeholder="Ej. 12345"
              />
            </div>
            {errorLogin && <p style={styles.errorText}>{errorLogin}</p>}
            <button type="submit" style={styles.btnPrimary}>Iniciar Sesión</button>
          </form>
        </div>
      </div>
    );
  }

  // PANTALLA PRINCIPAL (SISTEMA CRUD)
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={styles.badgeCloud}>☁ Cloud System Online</div>
          <button style={styles.btnLogout} onClick={() => setAutenticado(false)}>Cerrar Sesión</button>
        </div>
        <h1 style={styles.title}>Catálogo de Videojuegos Cloud</h1>
        {estadoServicio && (
          <div style={styles.statusBadgeContainer}>
            <span style={styles.statusDot}>●</span>
            <span>API: {estadoServicio.estado} | {estadoServicio.servidor} v{estadoServicio.version}</span>
          </div>
        )}
      </header>

      {/* PANEL DE BÚSQUEDA, FILTRADO Y ORDENAMIENTO */}
      <section style={styles.filterSection}>
        <input
          type="text"
          placeholder="🔍 Buscar juego..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...styles.input, flex: 2 }}
        />
        
        {/* Filtro por Género */}
        <select
          value={generoSeleccionado}
          onChange={(e) => setGeneroSeleccionado(e.target.value)}
          style={styles.select}
        >
          {generosDisponibles.map((cat, i) => (
            <option key={i} value={cat}>{cat === "Todos" ? "Todos los Géneros" : cat}</option>
          ))}
        </select>

        {/* Filtro por Plataforma (Incluye Multiplataforma y 'Todas') */}
        <select
          value={plataformaSeleccionada}
          onChange={(e) => setPlataformaSeleccionada(e.target.value)}
          style={styles.select}
        >
          <option value="Todas">Todas las Plataformas</option>
          <option value="Multiplataforma">🎮 Multiplataforma (&gt;= 2)</option>
          {LISTA_PLATAFORMAS.map((plat, i) => (
            <option key={i} value={plat}>{plat}</option>
          ))}
        </select>

        {/* Selector de Ordenamiento */}
        <select
          value={ordenamiento}
          onChange={(e) => setOrdenamiento(e.target.value)}
          style={styles.select}
        >
          <option value="nombre-asc">Sort: Nombre (A-Z)</option>
          <option value="nombre-desc">Sort: Nombre (Z-A)</option>
          <option value="precio-asc">Sort: Precio (Menor a Mayor)</option>
          <option value="precio-desc">Sort: Precio (Mayor a Menor)</option>
        </select>
      </section>

      {/* CONTENEDOR EN DOS COLUMNAS */}
      <div style={styles.mainGrid}>
        
        {/* PANEL DE AGREGAR / EDITAR (LADO IZQUIERDO) */}
        <section style={styles.sectionForm}>
          <h3>{modoEdicion ? "✏️ Editar Videojuego" : "➕ Agregar Nuevo Videojuego"}</h3>
          <form onSubmit={handleGuardar} style={styles.crudForm}>
            <input
              type="text"
              placeholder="Título del juego"
              style={styles.input}
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            />

            {/* SELECCIÓN MÚLTIPLE DE PLATAFORMAS (CHECKBOXES / CHIPS) */}
            <div>
              <label style={styles.labelFormGroup}>Plataformas Disponibles:</label>
              <div style={styles.platformSelectorContainer}>
                {LISTA_PLATAFORMAS.map((plat) => {
                  const seleccionada = formData.plataformasSeleccionadas.includes(plat);
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => togglePlataforma(plat)}
                      style={seleccionada ? styles.chipSelected : styles.chipUnselected}
                    >
                      {seleccionada ? "✓ " : "+ "}{plat}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              placeholder="Géneros (separados por coma. Ej: FPS, Shooter, Acción)"
              style={styles.input}
              value={formData.genero}
              onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio ($)"
              style={styles.input}
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
            />
            <input
              type="number"
              placeholder="Stock"
              style={styles.input}
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            />
            <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "10px" }}>
              <button type="submit" style={styles.btnSuccess}>
                {modoEdicion ? "Guardar Cambios" : "Agregar"}
              </button>
              {modoEdicion && (
                <button type="button" style={styles.btnCancel} onClick={resetForm}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* PANEL DE LA TABLA (LADO DERECHO) */}
        <section style={styles.sectionTable}>
          
          {/* BARRA DE CONTADORES E INDICADORES */}
          <div style={styles.counterBar}>
            <div style={styles.counterBadge}>
              📊 Total en Base de Datos: <strong>{productos.length}</strong>
            </div>
            <div style={styles.counterBadge}>
              🔍 Resultados Visibles: <strong>{productosOrdenados.length}</strong>
            </div>
          </div>

          {cargando ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Cargando catálogo desde Google Sheets...</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Plataforma(s)</th>
                  <th style={styles.th}>Género(s)</th>
                  <th style={styles.th}>Precio</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosOrdenados.map((p) => {
                  const platString = p.plataforma || "N/A";
                  const esMulti = platString.split(",").length >= 2;
                  return (
                    <tr key={p.id}>
                      <td style={styles.td}>#{p.id}</td>
                      <td style={styles.td}><strong>{p.nombre}</strong></td>
                      <td style={styles.td}>
                        {platString}
                        {esMulti && <span style={styles.multiBadge}>Multi</span>}
                      </td>
                      <td style={styles.td}>{p.genero || p.categoria || "N/A"}</td>
                      <td style={styles.td}>${p.precio}</td>
                      <td style={styles.td}>{p.stock} uds.</td>
                      <td style={styles.td}>
                        <button style={styles.btnEdit} onClick={() => handleEditar(p)}>Editar</button>
                        <button style={styles.btnDelete} onClick={() => handleEliminar(p.id)}>Eliminar</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

      </div>
    </div>
  );
}

// Estilos Modificados
const styles = {
  container: { padding: "30px", maxWidth: "1280px", margin: "0 auto", color: "#f8fafc", fontFamily: "sans-serif" },
  loginContainer: { height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  loginCard: { backgroundColor: "#1e293b", padding: "40px", borderRadius: "12px", border: "1px solid #334155", width: "350px", textAlign: "center" },
  loginTitle: { color: "#38bdf8", marginBottom: "8px" },
  loginSubtitle: { color: "#94a3b8", fontSize: "13px", marginBottom: "20px" },
  inputGroup: { marginBottom: "15px", textAlign: "left" },
  label: { display: "block", color: "#cbd5e1", fontSize: "13px", marginBottom: "5px" },
  labelFormGroup: { display: "block", color: "#cbd5e1", fontSize: "12px", marginBottom: "6px" },
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "#0f172a", color: "#fff", boxSizing: "border-box" },
  select: { padding: "10px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "#0f172a", color: "#fff", flex: 1, minWidth: "140px" },
  btnPrimary: { width: "100%", padding: "10px", backgroundColor: "#38bdf8", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" },
  btnSuccess: { width: "100%", padding: "10px 20px", backgroundColor: "#22c55e", border: "none", borderRadius: "6px", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  btnCancel: { width: "100%", padding: "10px 20px", backgroundColor: "#64748b", border: "none", borderRadius: "6px", color: "#fff", cursor: "pointer" },
  btnLogout: { backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" },
  errorText: { color: "#f87171", fontSize: "12px", marginTop: "8px" },
  header: { marginBottom: "20px" },
  badgeCloud: { color: "#38bdf8", fontSize: "14px" },
  title: { fontSize: "2rem", margin: "10px 0" },
  statusBadgeContainer: { fontSize: "12px", color: "#94a3b8" },
  statusDot: { color: "#22c55e", marginRight: "5px" },
  
  filterSection: { display: "flex", gap: "12px", marginBottom: "20px", backgroundColor: "#1e293b", padding: "15px", borderRadius: "10px", flexWrap: "wrap" },
  
  mainGrid: { display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", alignItems: "start" },
  
  sectionForm: { backgroundColor: "#1e293b", padding: "20px", borderRadius: "10px" },
  sectionTable: { backgroundColor: "#1e293b", borderRadius: "10px", overflow: "hidden" },
  crudForm: { display: "flex", flexDirection: "column", gap: "12px" },

  platformSelectorContainer: { display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "150px", overflowY: "auto", backgroundColor: "#0f172a", padding: "8px", borderRadius: "6px", border: "1px solid #475569" },
  chipSelected: { backgroundColor: "#0284c7", color: "#ffffff", border: "none", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", cursor: "pointer", fontWeight: "bold" },
  chipUnselected: { backgroundColor: "#334155", color: "#94a3b8", border: "none", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", cursor: "pointer" },

  counterBar: { display: "flex", gap: "15px", padding: "12px 16px", backgroundColor: "#0f172a", borderBottom: "1px solid #334155" },
  counterBadge: { fontSize: "13px", color: "#cbd5e1" },

  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#1e293b" },
  th: { padding: "12px", backgroundColor: "#334155", textAlign: "left", fontSize: "14px" },
  td: { padding: "12px", borderBottom: "1px solid #334155", fontSize: "14px" },
  btnEdit: { backgroundColor: "#eab308", border: "none", padding: "6px 12px", borderRadius: "4px", color: "#000", fontWeight: "bold", cursor: "pointer", marginRight: "5px" },
  btnDelete: { backgroundColor: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "4px", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  
  multiBadge: { marginLeft: "8px", backgroundColor: "#38bdf8", color: "#0f172a", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "bold" }
};

export default App;