import { useEffect, useState } from "react";
import "./App.css";

// Opciones predefinidas para el ComboBox de Plataformas
const OPCIONES_PLATAFORMAS = [
  "PlayStation 1",
  "PlayStation 2",
  "PlayStation 3",
  "PlayStation 4",
  "PlayStation 5",
  "Xbox Clásico",
  "Xbox 360",
  "Xbox One",
  "Xbox Series X/S",
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

  // Estados de Filtros Separados
  const [busqueda, setBusqueda] = useState("");
  const [generoSeleccionado, setGeneroSeleccionado] = useState("Todos");
  const [plataformaSeleccionada, setPlataformaSeleccionada] = useState("Todas");

  // Estados del Formulario (Crear / Editar)
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [formData, setFormData] = useState({
    titulo: "",
    plataforma: "PlayStation 5",
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

  // Guardar (Crear o Editar)
  const handleGuardar = (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.precio) {
      alert("Por favor completa al menos el título y el precio.");
      return;
    }

    const endpoint = modoEdicion
      ? `${API_URL}/api/productos/${idEditando}`
      : `${API_URL}/api/productos`;

    const metodo = modoEdicion ? "PUT" : "POST";

    fetch(endpoint, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
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
    setFormData({
      titulo: p.nombre,
      plataforma: p.plataforma || OPCIONES_PLATAFORMAS[0],
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
    setFormData({ titulo: "", plataforma: "PlayStation 5", genero: "", precio: "", stock: "" });
  };

  // Obtener géneros dinámicos de los productos existentes
  const generosDisponibles = [
    "Todos",
    ...new Set(
      productos
        .map((p) => p.genero || p.categoria)
        .filter(Boolean)
    )
  ];

  // Filtrado combinado (Nombre, Género y Plataforma)
  const productosFiltrados = productos.filter((p) => {
    const nombre = (p.nombre || "").toLowerCase();
    const genero = (p.genero || p.categoria || "").toLowerCase();
    const plataforma = (p.plataforma || "").toLowerCase();

    const coincideNombre = nombre.includes(busqueda.toLowerCase());
    const coincideGenero =
      generoSeleccionado === "Todos" || genero === generoSeleccionado.toLowerCase();
    const coincidePlataforma =
      plataformaSeleccionada === "Todas" || plataforma === plataformaSeleccionada.toLowerCase();

    return coincideNombre && coincideGenero && coincidePlataforma;
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

      {/* 2. PANEL DE BÚSQUEDA Y FILTRADO (ARRIBA DE LOS PANELES) */}
      <section style={styles.filterSection}>
        <input
          type="text"
          placeholder="🔍 Buscar juego..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{ ...styles.input, flex: 2 }}
        />
        
        {/* 4. FILTRO ÚNICAMENTE PARA GÉNEROS */}
        <select
          value={generoSeleccionado}
          onChange={(e) => setGeneroSeleccionado(e.target.value)}
          style={styles.select}
        >
          {generosDisponibles.map((cat, i) => (
            <option key={i} value={cat}>{cat === "Todos" ? "Todos los Géneros" : cat}</option>
          ))}
        </select>

        {/* 4. FILTRO ÚNICAMENTE PARA PLATAFORMAS */}
        <select
          value={plataformaSeleccionada}
          onChange={(e) => setPlataformaSeleccionada(e.target.value)}
          style={styles.select}
        >
          <option value="Todas">Todas las Plataformas</option>
          {OPCIONES_PLATAFORMAS.map((plat, i) => (
            <option key={i} value={plat}>{plat}</option>
          ))}
        </select>
      </section>

      {/* CONTENEDOR EN DOS COLUMNAS */}
      <div style={styles.mainGrid}>
        
        {/* 1. PANEL DE AGREGAR / EDITAR (LADO IZQUIERDO) */}
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
            
            {/* 3. COMBOBOX PARA SELECCIONAR PLATAFORMA */}
            <select
              style={styles.selectForm}
              value={formData.plataforma}
              onChange={(e) => setFormData({ ...formData, plataforma: e.target.value })}
            >
              {OPCIONES_PLATAFORMAS.map((plat, i) => (
                <option key={i} value={plat}>{plat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Género (Ej. RPG, Shooter)"
              style={styles.input}
              value={formData.genero}
              onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
            />
            <input
              type="number"
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

        {/* PANEL DE LA TABLA (LADO DERECHO AL MISMO NIVEL) */}
        <section style={styles.sectionTable}>
          {cargando ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Cargando catálogo desde Google Sheets...</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Título</th>
                  <th style={styles.th}>Plataforma</th>
                  <th style={styles.th}>Género</th>
                  <th style={styles.th}>Precio</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td style={styles.td}>#{p.id}</td>
                    <td style={styles.td}><strong>{p.nombre}</strong></td>
                    <td style={styles.td}>{p.plataforma || "N/A"}</td>
                    <td style={styles.td}>{p.genero || p.categoria || "N/A"}</td>
                    <td style={styles.td}>${p.precio}</td>
                    <td style={styles.td}>{p.stock} uds.</td>
                    <td style={styles.td}>
                      <button style={styles.btnEdit} onClick={() => handleEditar(p)}>Editar</button>
                      <button style={styles.btnDelete} onClick={() => handleEliminar(p.id)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
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
  input: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "#0f172a", color: "#fff", boxSizing: "border-box" },
  select: { padding: "10px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "#0f172a", color: "#fff", flex: 1, minWidth: "150px" },
  selectForm: { width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #475569", backgroundColor: "#0f172a", color: "#fff", boxSizing: "border-box" },
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
  
  /* Filtros Arriba */
  filterSection: { display: "flex", gap: "12px", marginBottom: "20px", backgroundColor: "#1e293b", padding: "15px", borderRadius: "10px" },
  
  /* Layout de Grid (Izquierda / Derecha) */
  mainGrid: { display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", alignItems: "start" },
  
  /* Paneles */
  sectionForm: { backgroundColor: "#1e293b", padding: "20px", borderRadius: "10px" },
  sectionTable: { backgroundColor: "#1e293b", borderRadius: "10px", overflow: "hidden" },
  crudForm: { display: "flex", flexDirection: "column", gap: "12px" },
  
  /* Tabla */
  table: { width: "100%", borderCollapse: "collapse", backgroundColor: "#1e293b" },
  th: { padding: "12px", backgroundColor: "#334155", textAlign: "left", fontSize: "14px" },
  td: { padding: "12px", borderBottom: "1px solid #334155", fontSize: "14px" },
  btnEdit: { backgroundColor: "#eab308", border: "none", padding: "6px 12px", borderRadius: "4px", color: "#000", fontWeight: "bold", cursor: "pointer", marginRight: "5px" },
  btnDelete: { backgroundColor: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "4px", color: "#fff", fontWeight: "bold", cursor: "pointer" }
};

export default App;