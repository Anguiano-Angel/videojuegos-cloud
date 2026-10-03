import { useEffect, useState } from "react";

function App() {
  const [productos, setProductos] = useState([]);
  const [estadoServicio, setEstadoServicio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  // Estados para Reto 1 y Reto 2
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("Todas");

  useEffect(() => {
    // Lee la variable de Netlify o usa directamente el nuevo backend de Render
    const API_URL = import.meta.env.VITE_API_URL || "https://videojuegos-backend-api.onrender.com";

    // Petición de Productos
    const fetchProductos = fetch(`${API_URL}/api/productos`).then((res) => {
      if (!res.ok) throw new Error("Error obteniendo productos");
      return res.json();
    });

    // Petición del Estado (Reto 3)
    const fetchEstado = fetch(`${API_URL}/api/estado`).then((res) => {
      if (!res.ok) throw new Error("Error obteniendo estado");
      return res.json();
    });

    Promise.all([fetchProductos, fetchEstado])
      .then(([dataProductos, dataEstado]) => {
        if (Array.isArray(dataProductos)) {
          setProductos(dataProductos);
        } else {
          setProductos([]);
        }
        setEstadoServicio(dataEstado);
        setCargando(false);
      })
      .catch((err) => {
        console.error("Error al cargar datos del servicio:", err);
        setError(true);
        setCargando(false);
      });
  }, []);

  // Extraer lista única de categorías para el filtro (Reto 2)
  const categorias = [
    "Todas",
    ...new Set(productos.map((p) => p.categoria).filter(Boolean))
  ];

  // Filtrado dinámico por nombre (Reto 1) y categoría (Reto 2)
  const productosFiltrados = productos.filter((producto) => {
    const coincideNombre = (producto.nombre || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaSeleccionada === "Todas" ||
      (producto.categoria || "").toLowerCase() === categoriaSeleccionada.toLowerCase();

    return coincideNombre && coincideCategoria;
  });

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <header style={styles.header}>
        <div style={styles.badgeCloud}>☁️️ Cloud Powered</div>
        <h1 style={styles.title}>Catálogo de Videojuegos Cloud</h1>
        <p style={styles.subtitle}>
          Catálogo dinámico consumiendo datos de <strong>Google Sheets</strong> a través de una API en <strong>Node.js (Render)</strong>.
        </p>

        {/* Reto 3: Muestra del Estado del Servicio */}
        {estadoServicio && (
          <div style={styles.statusBadgeContainer}>
            <span style={styles.statusDot}>●</span>
            <span>
              <strong>Estado:</strong> {estadoServicio.estado} |
              <strong> Servidor:</strong> {estadoServicio.servidor} |
              <strong> Servicio:</strong> {estadoServicio.servicio} v{estadoServicio.version}
            </span>
          </div>
        )}
      </header>

      {/* Panel de Filtros: Reto 1 y Reto 2 */}
      {!cargando && !error && (
        <section style={styles.filterSection}>
          {/* Reto 1: Buscador por Nombre */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>🔍 Buscar videojuego:</label>
            <input
              type="text"
              placeholder="Escribe un título..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Reto 2: Selector de Categoría */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>🏷️ Plataforma / Género:</label>
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              style={styles.select}
            >
              {categorias.map((cat, index) => (
                <option key={index} value={cat}>
                  {cat === "Todas" ? "Todas las categorías" : cat}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}

      {/* Estados de Carga y Error */}
      {cargando && (
        <div style={styles.statusBox}>
          <p>Cargando información y estado del servicio...</p>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <p>⚠️ No fue posible conectar con el servicio Cloud.</p>
        </div>
      )}

      {/* Lista de Productos */}
      {!cargando && !error && (
        <main style={styles.grid}>
          {productosFiltrados.length > 0 ? (
            productosFiltrados.map((producto, index) => (
              <div key={producto.id || index} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.categoryBadge}>{producto.categoria}</span>
                  <span style={styles.idBadge}>#{producto.id || index + 1}</span>
                </div>

                <h3 style={styles.productName}>{producto.nombre}</h3>

                <div style={styles.cardFooter}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={styles.priceLabel}>Precio</span>
                    <span style={styles.priceValue}>${producto.precio}</span>
                  </div>
                  {producto.stock && (
                    <div style={{ textAlign: "right" }}>
                      <span style={styles.priceLabel}>Stock</span>
                      <div style={styles.stockValue}>{producto.stock} uds.</div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={styles.noResults}>No se encontraron videojuegos que coincidan con la búsqueda.</p>
          )}
        </main>
      )}
    </div>
  );
}

// Estilos de la Interfaz
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "40px 20px",
    boxSizing: "border-box",
  },
  header: {
    textAlign: "center",
    maxWidth: "800px",
    margin: "0 auto 30px auto",
  },
  badgeCloud: {
    display: "inline-block",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    color: "#38bdf8",
    padding: "6px 16px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600",
    border: "1px solid rgba(56, 189, 248, 0.3)",
    marginBottom: "16px",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "800",
    margin: "0 0 12px 0",
    background: "linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "1.05rem",
    color: "#94a3b8",
    lineHeight: "1.6",
    marginBottom: "16px",
  },
  statusBadgeContainer: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    padding: "8px 16px",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#cbd5e1",
  },
  statusDot: {
    color: "#34d399",
    fontSize: "16px",
  },
  filterSection: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
    maxWidth: "800px",
    margin: "0 auto 32px auto",
    backgroundColor: "#1e293b",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #334155",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    flex: "1 1 250px",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#cbd5e1",
  },
  input: {
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
  },
  select: {
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "#f8fafc",
    fontSize: "14px",
    outline: "none",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #334155",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  categoryBadge: {
    backgroundColor: "#334155",
    color: "#cbd5e1",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  idBadge: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "bold",
  },
  productName: {
    fontSize: "1.4rem",
    fontWeight: "700",
    margin: "0 0 20px 0",
    color: "#f1f5f9",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #334155",
    paddingTop: "16px",
  },
  priceLabel: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  priceValue: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#34d399",
  },
  stockValue: {
    fontSize: "1rem",
    fontWeight: "700",
    color: "#38bdf8",
  },
  noResults: {
    gridColumn: "1 / -1",
    textAlign: "center",
    color: "#94a3b8",
    padding: "40px",
  },
  statusBox: {
    textAlign: "center",
    padding: "40px",
    color: "#94a3b8",
  },
  errorBox: {
    textAlign: "center",
    padding: "20px",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    border: "1px solid #ef4444",
    borderRadius: "12px",
    color: "#fca5a5",
    maxWidth: "500px",
    margin: "0 auto",
  },
};

export default App;