import { useEffect, useState } from "react";
import "./App.css";

// Opciones predefinidas de Plataformas
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
  // Estado de Autenticación
  const [autenticado, setAutenticado] = useState(false);
  const [credenciales, setCredenciales] = useState({
    usuario: "",
    password: ""
  });
  const [errorLogin, setErrorLogin] = useState("");

  // Navegación
  const [vistaActual, setVistaActual] = useState("catalogo");

  // Favoritos
  const [favoritos, setFavoritos] = useState([]);
  const [mostrarSoloFavoritos, setMostrarSoloFavoritos] = useState(false);

  // Modal
  const [juegoDetalleModal, setJuegoDetalleModal] = useState(null);

  // Productos y API
  const [productos, setProductos] = useState([]);
  const [estadoServicio, setEstadoServicio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorAPI, setErrorAPI] = useState(false);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [generoSeleccionado, setGeneroSeleccionado] = useState("Todos");
  const [plataformaSeleccionada, setPlataformaSeleccionada] =
    useState("Todas");
  const [ordenamiento, setOrdenamiento] = useState("nombre-asc");

  // Formulario
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    plataformasSeleccionadas: ["PlayStation 5"],
    genero: "",
    precio: "",
    stock: "",
    imagen: ""
  });

  // NUEVO: archivo seleccionado y vista previa
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [vistaPreviaImagen, setVistaPreviaImagen] = useState("");

  // NUEVO: estado mientras se sube la imagen
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://videojuegos-backend-api.onrender.com";

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = (e) => {
    e.preventDefault();

    if (
      credenciales.usuario === "admin" &&
      credenciales.password === "12345"
    ) {
      setAutenticado(true);
      setErrorLogin("");
    } else {
      setErrorLogin(
        "Credenciales incorrectas. (Prueba: admin / 12345)"
      );
    }
  };

  // =====================================================
  // CARGAR DATOS
  // =====================================================

  const cargarDatos = () => {
    setCargando(true);

    const fetchProductos = fetch(
      `${API_URL}/api/productos`
    ).then((res) => res.json());

    const fetchEstado = fetch(
      `${API_URL}/api/estado`
    ).then((res) => res.json());

    Promise.all([fetchProductos, fetchEstado])
      .then(([dataProductos, dataEstado]) => {
        setProductos(
          Array.isArray(dataProductos) ? dataProductos : []
        );

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

  // =====================================================
  // FAVORITOS
  // =====================================================

  const toggleFavorito = (id) => {
    setFavoritos((prev) =>
      prev.includes(id)
        ? prev.filter((favId) => favId !== id)
        : [...prev, id]
    );
  };

  // =====================================================
  // PLATAFORMAS
  // =====================================================

  const togglePlataforma = (plat) => {
    setFormData((prev) => {
      const existe =
        prev.plataformasSeleccionadas.includes(plat);

      if (existe) {
        if (prev.plataformasSeleccionadas.length === 1) {
          return prev;
        }

        return {
          ...prev,
          plataformasSeleccionadas:
            prev.plataformasSeleccionadas.filter(
              (p) => p !== plat
            )
        };
      } else {
        return {
          ...prev,
          plataformasSeleccionadas: [
            ...prev.plataformasSeleccionadas,
            plat
          ]
        };
      }
    });
  };

  // =====================================================
  // VALIDACIÓN
  // =====================================================

  const validarFormulario = () => {
    if (!formData.titulo.trim()) {
      alert("⚠️ El título del juego es obligatorio.");
      return false;
    }

    if (
      formData.plataformasSeleccionadas.length === 0
    ) {
      alert(
        "⚠️ Debes seleccionar al menos una plataforma."
      );
      return false;
    }

    if (!formData.genero.trim()) {
      alert("⚠️ Ingresa al menos un género.");
      return false;
    }

    const precioNum = parseFloat(formData.precio);

    if (isNaN(precioNum) || precioNum <= 0) {
      alert(
        "⚠️ Por favor ingresa un precio válido mayor a 0."
      );
      return false;
    }

    const stockNum = parseInt(formData.stock, 10);

    if (isNaN(stockNum) || stockNum < 0) {
      alert(
        "⚠️ El stock debe ser un número entero igual o mayor a 0."
      );
      return false;
    }

    return true;
  };

  // =====================================================
  // NUEVO: SELECCIONAR IMAGEN
  // =====================================================

  const handleSeleccionarImagen = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) {
      return;
    }

    // Verificar que sea una imagen
    if (!archivo.type.startsWith("image/")) {
      alert("⚠️ Solo puedes seleccionar archivos de imagen.");
      e.target.value = "";
      return;
    }

    // Verificar tamaño máximo de 5 MB
    if (archivo.size > 5 * 1024 * 1024) {
      alert("⚠️ La imagen no puede superar los 5 MB.");
      e.target.value = "";
      return;
    }

    setArchivoImagen(archivo);

    // Crear vista previa local
    const urlPrevia = URL.createObjectURL(archivo);
    setVistaPreviaImagen(urlPrevia);
  };

  // =====================================================
  // NUEVO: SUBIR IMAGEN A CLOUDINARY
  // =====================================================

  const subirImagen = async () => {
    // Si no se seleccionó una imagen nueva,
    // conservamos la URL que ya tiene el formulario.
    if (!archivoImagen) {
      return formData.imagen;
    }

    setSubiendoImagen(true);

    try {
      const datosImagen = new FormData();

      datosImagen.append("imagen", archivoImagen);

      const respuesta = await fetch(
        `${API_URL}/api/upload`,
        {
          method: "POST",
          body: datosImagen
        }
      );

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo subir la imagen"
        );
      }

      if (!resultado.urlImagen) {
        throw new Error(
          "Cloudinary no devolvió una URL de imagen."
        );
      }

      return resultado.urlImagen;

    } catch (error) {
      console.error(
        "Error subiendo imagen:",
        error
      );

      throw error;

    } finally {
      setSubiendoImagen(false);
    }
  };

  // =====================================================
  // GUARDAR / ACTUALIZAR
  // =====================================================

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      // -------------------------------------------------
      // 1. Subir imagen a Cloudinary si seleccionamos una
      // -------------------------------------------------

      let urlImagen = formData.imagen;

      if (archivoImagen) {
        urlImagen = await subirImagen();
      }

      // -------------------------------------------------
      // 2. Preparar datos del videojuego
      // -------------------------------------------------

      const payload = {
        titulo: formData.titulo,
        plataforma:
          formData.plataformasSeleccionadas.join(", "),
        genero: formData.genero,
        precio: formData.precio,
        stock: formData.stock,
        imagen: urlImagen
      };

      // -------------------------------------------------
      // 3. Guardar en Google Sheets mediante el backend
      // -------------------------------------------------

      const endpoint = modoEdicion
        ? `${API_URL}/api/productos/${idEditando}`
        : `${API_URL}/api/productos`;

      const metodo = modoEdicion ? "PUT" : "POST";

      const respuesta = await fetch(endpoint, {
        method: metodo,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          resultado.error ||
            "No se pudo guardar el registro."
        );
      }

      // -------------------------------------------------
      // 4. Mostrar resultado
      // -------------------------------------------------

      alert(
        modoEdicion
          ? "¡Registro actualizado!"
          : "¡Videojuego creado con éxito!"
      );

      resetForm();
      cargarDatos();

    } catch (error) {
      console.error(
        "Error al guardar:",
        error
      );

      alert(
        `❌ Error al guardar el registro:\n${error.message}`
      );
    }
  };

  // =====================================================
  // PREPARAR EDICIÓN
  // =====================================================

  const handleEditar = (p) => {
    setModoEdicion(true);
    setIdEditando(p.id);

    const platString = p.plataforma || "";

    const arrayPlats = platString
      .split(",")
      .map((item) => item.trim())
      .filter((item) =>
        LISTA_PLATAFORMAS.includes(item)
      );

    const imagenExistente =
      p.imagen || p.urlImagen || "";

    setFormData({
      titulo: p.nombre,
      plataformasSeleccionadas:
        arrayPlats.length > 0
          ? arrayPlats
          : ["PlayStation 5"],
      genero: p.genero || p.categoria || "",
      precio: p.precio,
      stock: p.stock,
      imagen: imagenExistente
    });

    // Limpiar archivo nuevo
    setArchivoImagen(null);

    // Mostrar la imagen existente
    setVistaPreviaImagen(imagenExistente);

    setVistaActual("administracion");
  };

  // =====================================================
  // ELIMINAR
  // =====================================================

  const handleEliminar = (id) => {
    if (
      window.confirm(
        "¿Seguro que deseas eliminar este videojuego de Google Sheets?"
      )
    ) {
      fetch(
        `${API_URL}/api/productos/${id}`,
        {
          method: "DELETE"
        }
      )
        .then((res) => res.json())
        .then(() => {
          alert("Registro eliminado.");
          cargarDatos();
        })
        .catch(() =>
          alert("Error al eliminar.")
        );
    }
  };

  // =====================================================
  // REINICIAR FORMULARIO
  // =====================================================

  const resetForm = () => {
    setModoEdicion(false);
    setIdEditando(null);

    setFormData({
      titulo: "",
      plataformasSeleccionadas: ["PlayStation 5"],
      genero: "",
      precio: "",
      stock: "",
      imagen: ""
    });

    setArchivoImagen(null);
    setVistaPreviaImagen("");
    setSubiendoImagen(false);
  };

  // =====================================================
  // GÉNEROS
  // =====================================================

  const generosDisponibles = [
    "Todos",
    ...new Set(
      productos
        .flatMap((p) => {
          const raw =
            p.genero || p.categoria || "";

          return raw
            .split(",")
            .map((g) => g.trim());
        })
        .filter(Boolean)
    )
  ];

  // =====================================================
  // IMAGEN DEL JUEGO
  // =====================================================

  const obtenerImagenJuego = (p) => {
    if (
      p.imagen &&
      p.imagen.trim().startsWith("http")
    ) {
      return p.imagen;
    }

    if (
      p.urlImagen &&
      p.urlImagen.trim().startsWith("http")
    ) {
      return p.urlImagen;
    }

    return `https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80`;
  };

  // =====================================================
  // FILTRADO
  // =====================================================

  const productosFiltrados = productos.filter(
    (p) => {
      const nombre =
        (p.nombre || "").toLowerCase();

      const generoRaw =
        (
          p.genero ||
          p.categoria ||
          ""
        ).toLowerCase();

      const listaGenerosJuego =
        generoRaw
          .split(",")
          .map((g) => g.trim());

      const plataformaRaw =
        (p.plataforma || "").toLowerCase();

      const listaPlataformasJuego =
        plataformaRaw
          .split(",")
          .map((plat) => plat.trim());

      const coincideNombre =
        nombre.includes(
          busqueda.toLowerCase()
        );

      const coincideGenero =
        generoSeleccionado === "Todos" ||
        listaGenerosJuego.includes(
          generoSeleccionado.toLowerCase()
        );

      let coincidePlataforma = false;

      if (
        plataformaSeleccionada === "Todas"
      ) {
        coincidePlataforma = true;
      } else if (
        plataformaSeleccionada ===
        "Multiplataforma"
      ) {
        coincidePlataforma =
          listaPlataformasJuego.length >= 2;
      } else {
        coincidePlataforma =
          listaPlataformasJuego.includes(
            plataformaSeleccionada.toLowerCase()
          );
      }

      const coincideFavorito =
        !mostrarSoloFavoritos ||
        favoritos.includes(p.id);

      return (
        coincideNombre &&
        coincideGenero &&
        coincidePlataforma &&
        coincideFavorito
      );
    }
  );

  // =====================================================
  // ORDENAMIENTO
  // =====================================================

  const productosOrdenados = [
    ...productosFiltrados
  ].sort((a, b) => {
    const nombreA =
      (a.nombre || "").toLowerCase();

    const nombreB =
      (b.nombre || "").toLowerCase();

    const precioA =
      parseFloat(a.precio) || 0;

    const precioB =
      parseFloat(b.precio) || 0;

    if (
      ordenamiento === "nombre-asc"
    ) {
      return nombreA.localeCompare(
        nombreB
      );
    }

    if (
      ordenamiento === "nombre-desc"
    ) {
      return nombreB.localeCompare(
        nombreA
      );
    }

    if (
      ordenamiento === "precio-asc"
    ) {
      return precioA - precioB;
    }

    if (
      ordenamiento === "precio-desc"
    ) {
      return precioB - precioA;
    }

    return 0;
  });

  // =====================================================
  // LOGIN
  // =====================================================

  if (!autenticado) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <h2 style={styles.loginTitle}>
            ☁️ Acceso al Sistema Cloud
          </h2>

          <p style={styles.loginSubtitle}>
            Ingresa tus credenciales para
            administrar el catálogo
          </p>

          <form
            onSubmit={handleLogin}
            style={styles.form}
          >
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Usuario:
              </label>

              <input
                type="text"
                style={styles.input}
                value={
                  credenciales.usuario
                }
                onChange={(e) =>
                  setCredenciales({
                    ...credenciales,
                    usuario:
                      e.target.value
                  })
                }
                placeholder="Ej. admin"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Contraseña:
              </label>

              <input
                type="password"
                style={styles.input}
                value={
                  credenciales.password
                }
                onChange={(e) =>
                  setCredenciales({
                    ...credenciales,
                    password:
                      e.target.value
                  })
                }
                placeholder="Ej. 12345"
              />
            </div>

            {errorLogin && (
              <p style={styles.errorText}>
                {errorLogin}
              </p>
            )}

            <button
              type="submit"
              style={styles.btnPrimary}
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // =====================================================
  // PANTALLA PRINCIPAL
  // =====================================================

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <header style={styles.header}>
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center"
          }}
        >
          <div style={styles.badgeCloud}>
            ☁ Cloud System Online
          </div>

          <button
            style={styles.btnLogout}
            onClick={() =>
              setAutenticado(false)
            }
          >
            Cerrar Sesión
          </button>
        </div>

        <h1 style={styles.title}>
          Catálogo de Videojuegos Cloud
        </h1>

        {estadoServicio && (
          <div
            style={
              styles.statusBadgeContainer
            }
          >
            <span
              style={styles.statusDot}
            >
              ●
            </span>

            <span>
              API:{" "}
              {estadoServicio.estado} |{" "}
              {estadoServicio.servidor} v
              {estadoServicio.version}
            </span>
          </div>
        )}

        {/* NAVEGACIÓN */}
        <nav style={styles.navBar}>
          <button
            style={
              vistaActual ===
              "catalogo"
                ? styles.navButtonActive
                : styles.navButton
            }
            onClick={() =>
              setVistaActual("catalogo")
            }
          >
            🖼️ Catálogo Visual
            (Principal)
          </button>

          <button
            style={
              vistaActual ===
              "administracion"
                ? styles.navButtonActive
                : styles.navButton
            }
            onClick={() =>
              setVistaActual(
                "administracion"
              )
            }
          >
            ⚙️ Administración / Lista
          </button>
        </nav>
      </header>

      {/* FILTROS */}
      <section
        style={styles.filterSection}
      >
        <input
          type="text"
          placeholder="🔍 Buscar juego..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
          style={{
            ...styles.input,
            flex: 2
          }}
        />

        <select
          value={generoSeleccionado}
          onChange={(e) =>
            setGeneroSeleccionado(
              e.target.value
            )
          }
          style={styles.select}
        >
          {generosDisponibles.map(
            (cat, i) => (
              <option
                key={i}
                value={cat}
              >
                {cat === "Todos"
                  ? "Todos los Géneros"
                  : cat}
              </option>
            )
          )}
        </select>

        <select
          value={
            plataformaSeleccionada
          }
          onChange={(e) =>
            setPlataformaSeleccionada(
              e.target.value
            )
          }
          style={styles.select}
        >
          <option value="Todas">
            Todas las Plataformas
          </option>

          <option value="Multiplataforma">
            Multiplataforma
          </option>

          {LISTA_PLATAFORMAS.map(
            (plat, i) => (
              <option
                key={i}
                value={plat}
              >
                {plat}
              </option>
            )
          )}
        </select>

        <select
          value={ordenamiento}
          onChange={(e) =>
            setOrdenamiento(
              e.target.value
            )
          }
          style={styles.select}
        >
          <option value="nombre-asc">
            Sort: Nombre (A-Z)
          </option>

          <option value="nombre-desc">
            Sort: Nombre (Z-A)
          </option>

          <option value="precio-asc">
            Sort: Precio (Menor a Mayor)
          </option>

          <option value="precio-desc">
            Sort: Precio (Mayor a Menor)
          </option>
        </select>

        <button
          type="button"
          style={
            mostrarSoloFavoritos
              ? styles.btnFavActive
              : styles.btnFavInactive
          }
          onClick={() =>
            setMostrarSoloFavoritos(
              !mostrarSoloFavoritos
            )
          }
        >
          {mostrarSoloFavoritos
            ? "❤️ Viendo Favoritos"
            : "🤍 Ver Favoritos"}{" "}
          ({favoritos.length})
        </button>
      </section>

      {/* CONTADORES */}
      <div style={styles.counterBar}>
        <div style={styles.counterBadge}>
          📊 Total en Base de Datos:{" "}
          <strong>
            {productos.length}
          </strong>
        </div>

        <div style={styles.counterBadge}>
          🔍 Resultados Visibles:{" "}
          <strong>
            {productosOrdenados.length}
          </strong>
        </div>
      </div>

      {cargando ? (
        <p
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "16px"
          }}
        >
          Cargando catálogo desde
          Google Sheets...
        </p>
      ) : (
        <>
          {/* =====================================================
              CATÁLOGO
          ===================================================== */}

          {vistaActual ===
            "catalogo" && (
            <section
              style={styles.cardsGrid}
            >
              {productosOrdenados.length ===
              0 ? (
                <div
                  style={styles.emptyState}
                >
                  <p>
                    No se encontraron
                    videojuegos que
                    coincidan con los
                    filtros seleccionados.
                  </p>
                </div>
              ) : (
                productosOrdenados.map(
                  (p) => {
                    const esFav =
                      favoritos.includes(
                        p.id
                      );

                    const platString =
                      p.plataforma ||
                      "N/A";

                    const esMulti =
                      platString.split(
                        ","
                      ).length >= 2;

                    const imgUrl =
                      obtenerImagenJuego(
                        p
                      );

                    return (
                      <div
                        key={p.id}
                        style={styles.card}
                      >
                        <div
                          style={
                            styles.cardImageContainer
                          }
                        >
                          <img
                            src={imgUrl}
                            alt={p.nombre}
                            style={
                              styles.cardImage
                            }
                          />

                          <button
                            style={
                              styles.cardFavButton
                            }
                            onClick={() =>
                              toggleFavorito(
                                p.id
                              )
                            }
                            title={
                              esFav
                                ? "Quitar de Favoritos"
                                : "Agregar a Favoritos"
                            }
                          >
                            {esFav
                              ? "❤️"
                              : "🤍"}
                          </button>

                          {esMulti && (
                            <span
                              style={
                                styles.cardMultiBadge
                              }
                            >
                              Multiplataforma
                            </span>
                          )}
                        </div>

                        <div
                          style={
                            styles.cardBody
                          }
                        >
                          <h3
                            style={
                              styles.cardTitle
                            }
                          >
                            {p.nombre}
                          </h3>

                          <p
                            style={
                              styles.cardGenre
                            }
                          >
                            🏷️{" "}
                            {p.genero ||
                              p.categoria ||
                              "General"}
                          </p>

                          <p
                            style={
                              styles.cardPlatform
                            }
                          >
                            🎮{" "}
                            {platString}
                          </p>

                          <div
                            style={
                              styles.cardFooter
                            }
                          >
                            <div>
                              <span
                                style={
                                  styles.cardPrice
                                }
                              >
                                ${p.precio}
                              </span>

                              <span
                                style={
                                  styles.cardStock
                                }
                              >
                                {p.stock}{" "}
                                dispon.
                              </span>
                            </div>

                            <button
                              style={
                                styles.btnQuickView
                              }
                              onClick={() =>
                                setJuegoDetalleModal(
                                  p
                                )
                              }
                            >
                              👁️ Detalle
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </section>
          )}

          {/* =====================================================
              ADMINISTRACIÓN
          ===================================================== */}

          {vistaActual ===
            "administracion" && (
            <div
              style={styles.mainGrid}
            >

              {/* FORMULARIO */}
              <section
                style={styles.sectionForm}
              >
                <h3>
                  {modoEdicion
                    ? "✏️ Editar Videojuego"
                    : "➕ Agregar Nuevo Videojuego"}
                </h3>

                <form
                  onSubmit={
                    handleGuardar
                  }
                  style={
                    styles.crudForm
                  }
                >

                  <input
                    type="text"
                    placeholder="Título del juego"
                    style={
                      styles.input
                    }
                    value={
                      formData.titulo
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        titulo:
                          e.target.value
                      })
                    }
                  />

                  {/* PLATAFORMAS */}
                  <div>
                    <label
                      style={
                        styles.labelFormGroup
                      }
                    >
                      Plataformas
                      Disponibles:
                    </label>

                    <div
                      style={
                        styles.platformSelectorContainer
                      }
                    >
                      {LISTA_PLATAFORMAS.map(
                        (plat) => {
                          const seleccionada =
                            formData.plataformasSeleccionadas.includes(
                              plat
                            );

                          return (
                            <button
                              key={plat}
                              type="button"
                              onClick={() =>
                                togglePlataforma(
                                  plat
                                )
                              }
                              style={
                                seleccionada
                                  ? styles.chipSelected
                                  : styles.chipUnselected
                              }
                            >
                              {seleccionada
                                ? "✓ "
                                : "+ "}
                              {plat}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Géneros (separados por coma. Ej: FPS, Shooter)"
                    style={
                      styles.input
                    }
                    value={
                      formData.genero
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        genero:
                          e.target.value
                      })
                    }
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio ($)"
                    style={
                      styles.input
                    }
                    value={
                      formData.precio
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio:
                          e.target.value
                      })
                    }
                  />

                  <input
                    type="number"
                    placeholder="Stock"
                    style={
                      styles.input
                    }
                    value={
                      formData.stock
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock:
                          e.target.value
                      })
                    }
                  />

                  {/* =================================================
                      NUEVO SELECTOR DE IMAGEN
                  ================================================= */}

                  <div
                    style={
                      styles.imageUploadContainer
                    }
                  >
                    <label
                      style={
                        styles.labelFormGroup
                      }
                    >
                      Imagen de portada:
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={
                        handleSeleccionarImagen
                      }
                      style={
                        styles.fileInput
                      }
                    />

                    <small
                      style={
                        styles.imageHelpText
                      }
                    >
                      Formatos de imagen
                      permitidos.
                      Máximo 5 MB.
                    </small>

                    {/* VISTA PREVIA */}
                    {vistaPreviaImagen && (
                      <div
                        style={
                          styles.imagePreviewContainer
                        }
                      >
                        <img
                          src={
                            vistaPreviaImagen
                          }
                          alt="Vista previa"
                          style={
                            styles.imagePreview
                          }
                        />

                        <div
                          style={
                            styles.imagePreviewText
                          }
                        >
                          {archivoImagen
                            ? `Nueva imagen: ${archivoImagen.name}`
                            : "Imagen actual"}
                        </div>
                      </div>
                    )}

                    {/* URL OCULTA / INFORMATIVA */}
                    {formData.imagen &&
                      !archivoImagen && (
                        <small
                          style={
                            styles.imageUrlText
                          }
                        >
                          ✓ Esta imagen ya
                          está guardada en
                          Cloudinary.
                        </small>
                      )}
                  </div>

                  {/* BOTONES */}
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      width: "100%",
                      marginTop: "10px"
                    }}
                  >
                    <button
                      type="submit"
                      style={
                        styles.btnSuccess
                      }
                      disabled={
                        subiendoImagen
                      }
                    >
                      {subiendoImagen
                        ? "⏳ Subiendo imagen..."
                        : modoEdicion
                        ? "Guardar Cambios"
                        : "Agregar"}
                    </button>

                    {modoEdicion && (
                      <button
                        type="button"
                        style={
                          styles.btnCancel
                        }
                        onClick={
                          resetForm
                        }
                        disabled={
                          subiendoImagen
                        }
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </section>

              {/* TABLA */}
              <section
                style={styles.sectionTable}
              >
                <table
                  style={styles.table}
                >
                  <thead>
                    <tr>
                      <th
                        style={styles.th}
                      >
                        ID
                      </th>

                      <th
                        style={styles.th}
                      >
                        Título
                      </th>

                      <th
                        style={styles.th}
                      >
                        Plataforma(s)
                      </th>

                      <th
                        style={styles.th}
                      >
                        Género(s)
                      </th>

                      <th
                        style={styles.th}
                      >
                        Precio
                      </th>

                      <th
                        style={styles.th}
                      >
                        Stock
                      </th>

                      <th
                        style={styles.th}
                      >
                        Acciones
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {productosOrdenados.map(
                      (p) => {
                        const platString =
                          p.plataforma ||
                          "N/A";

                        const esMulti =
                          platString.split(
                            ","
                          ).length >= 2;

                        return (
                          <tr
                            key={p.id}
                          >
                            <td
                              style={
                                styles.td
                              }
                            >
                              #{p.id}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <strong>
                                {p.nombre}
                              </strong>
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {platString}

                              {esMulti && (
                                <span
                                  style={
                                    styles.multiBadge
                                  }
                                >
                                  Multi
                                </span>
                              )}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {p.genero ||
                                p.categoria ||
                                "N/A"}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              ${p.precio}
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              {p.stock} uds.
                            </td>

                            <td
                              style={
                                styles.td
                              }
                            >
                              <button
                                style={
                                  styles.btnEdit
                                }
                                onClick={() =>
                                  handleEditar(
                                    p
                                  )
                                }
                              >
                                Editar
                              </button>

                              <button
                                style={
                                  styles.btnDelete
                                }
                                onClick={() =>
                                  handleEliminar(
                                    p.id
                                  )
                                }
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </section>
            </div>
          )}
        </>
      )}

      {/* =====================================================
          MODAL
      ===================================================== */}

      {juegoDetalleModal && (
        <div
          style={
            styles.modalOverlay
          }
          onClick={() =>
            setJuegoDetalleModal(
              null
            )
          }
        >
          <div
            style={
              styles.modalContent
            }
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              style={
                styles.modalCloseButton
              }
              onClick={() =>
                setJuegoDetalleModal(
                  null
                )
              }
            >
              ✖
            </button>

            <div
              style={
                styles.modalGrid
              }
            >
              <img
                src={obtenerImagenJuego(
                  juegoDetalleModal
                )}
                alt={
                  juegoDetalleModal.nombre
                }
                style={
                  styles.modalImage
                }
              />

              <div
                style={
                  styles.modalInfo
                }
              >
                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    juegoDetalleModal.nombre
                  }
                </h2>

                <div
                  style={
                    styles.modalBadgeRow
                  }
                >
                  <span
                    style={
                      styles.modalBadge
                    }
                  >
                    ID: #
                    {
                      juegoDetalleModal.id
                    }
                  </span>

                  <span
                    style={
                      styles.modalBadgePrice
                    }
                  >
                    $
                    {
                      juegoDetalleModal.precio
                    }
                  </span>
                </div>

                <p>
                  <strong>
                    🎮 Plataformas:
                  </strong>{" "}
                  {
                    juegoDetalleModal.plataforma ||
                    "N/A"
                  }
                </p>

                <p>
                  <strong>
                    🏷️ Género(s):
                  </strong>{" "}
                  {
                    juegoDetalleModal.genero ||
                    juegoDetalleModal.categoria ||
                    "General"
                  }
                </p>

                <p>
                  <strong>
                    📦 Stock Disponible:
                  </strong>{" "}
                  {
                    juegoDetalleModal.stock
                  }{" "}
                  unidades
                </p>

                <div
                  style={{
                    marginTop:
                      "20px",
                    display:
                      "flex",
                    gap: "10px"
                  }}
                >
                  <button
                    style={
                      styles.btnSuccess
                    }
                    onClick={() => {
                      const id =
                        juegoDetalleModal.id;

                      setJuegoDetalleModal(
                        null
                      );

                      handleEditar(
                        productos.find(
                          (p) =>
                            p.id === id
                        )
                      );
                    }}
                  >
                    ✏️ Editar este Juego
                  </button>

                  <button
                    style={
                      styles.btnCancel
                    }
                    onClick={() =>
                      setJuegoDetalleModal(
                        null
                      )
                    }
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles = {
  container: {
    padding: "30px",
    maxWidth: "1280px",
    margin: "0 auto",
    color: "#f8fafc",
    fontFamily: "sans-serif"
  },

  loginContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0f172a"
  },

  loginCard: {
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "12px",
    border: "1px solid #334155",
    width: "350px",
    textAlign: "center"
  },

  loginTitle: {
    color: "#38bdf8",
    marginBottom: "8px"
  },

  loginSubtitle: {
    color: "#94a3b8",
    fontSize: "13px",
    marginBottom: "20px"
  },

  inputGroup: {
    marginBottom: "15px",
    textAlign: "left"
  },

  label: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "13px",
    marginBottom: "5px"
  },

  labelFormGroup: {
    display: "block",
    color: "#cbd5e1",
    fontSize: "12px",
    marginBottom: "6px"
  },

  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "#fff",
    boxSizing: "border-box"
  },

  select: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "#fff",
    flex: 1,
    minWidth: "140px"
  },

  btnPrimary: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#38bdf8",
    border: "none",
    borderRadius: "6px",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px"
  },

  btnSuccess: {
    width: "100%",
    padding: "10px 20px",
    backgroundColor: "#22c55e",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  btnCancel: {
    width: "100%",
    padding: "10px 20px",
    backgroundColor: "#64748b",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer"
  },

  btnLogout: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },

  errorText: {
    color: "#f87171",
    fontSize: "12px",
    marginTop: "8px"
  },

  header: {
    marginBottom: "20px"
  },

  badgeCloud: {
    color: "#38bdf8",
    fontSize: "14px"
  },

  title: {
    fontSize: "2rem",
    margin: "10px 0"
  },

  statusBadgeContainer: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "15px"
  },

  statusDot: {
    color: "#22c55e",
    marginRight: "5px"
  },

  navBar: {
    display: "flex",
    gap: "10px",
    marginTop: "15px"
  },

  navButton: {
    padding: "10px 18px",
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  navButtonActive: {
    padding: "10px 18px",
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  filterSection: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    backgroundColor: "#1e293b",
    padding: "15px",
    borderRadius: "10px",
    flexWrap: "wrap",
    alignItems: "center"
  },

  btnFavActive: {
    padding: "10px 14px",
    backgroundColor: "#e11d48",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  btnFavInactive: {
    padding: "10px 14px",
    backgroundColor: "#334155",
    color: "#cbd5e1",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },

  mainGrid: {
    display: "grid",
    gridTemplateColumns: "340px 1fr",
    gap: "20px",
    alignItems: "start"
  },

  sectionForm: {
    backgroundColor: "#1e293b",
    padding: "20px",
    borderRadius: "10px"
  },

  sectionTable: {
    backgroundColor: "#1e293b",
    borderRadius: "10px",
    overflow: "hidden"
  },

  crudForm: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  platformSelectorContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxHeight: "150px",
    overflowY: "auto",
    backgroundColor: "#0f172a",
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #475569"
  },

  chipSelected: {
    backgroundColor: "#0284c7",
    color: "#ffffff",
    border: "none",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  chipUnselected: {
    backgroundColor: "#334155",
    color: "#94a3b8",
    border: "none",
    padding: "4px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    cursor: "pointer"
  },

  // =====================================================
  // NUEVOS ESTILOS PARA IMAGEN
  // =====================================================

  imageUploadContainer: {
    width: "100%",
    padding: "12px",
    boxSizing: "border-box",
    backgroundColor: "#0f172a",
    border: "1px solid #475569",
    borderRadius: "8px"
  },

  fileInput: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    backgroundColor: "#1e293b",
    color: "#cbd5e1",
    border: "1px solid #475569",
    borderRadius: "6px",
    cursor: "pointer"
  },

  imageHelpText: {
    display: "block",
    color: "#94a3b8",
    fontSize: "11px",
    marginTop: "5px"
  },

  imagePreviewContainer: {
    marginTop: "12px",
    textAlign: "center"
  },

  imagePreview: {
    width: "100%",
    maxWidth: "220px",
    height: "140px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #475569"
  },

  imagePreviewText: {
    color: "#cbd5e1",
    fontSize: "11px",
    marginTop: "5px",
    wordBreak: "break-word"
  },

  imageUrlText: {
    display: "block",
    color: "#22c55e",
    fontSize: "11px",
    marginTop: "8px"
  },

  counterBar: {
    display: "flex",
    gap: "15px",
    padding: "12px 16px",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    marginBottom: "20px"
  },

  counterBadge: {
    fontSize: "13px",
    color: "#cbd5e1"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "#1e293b"
  },

  th: {
    padding: "12px",
    backgroundColor: "#334155",
    textAlign: "left",
    fontSize: "14px"
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #334155",
    fontSize: "14px"
  },

  btnEdit: {
    backgroundColor: "#eab308",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "5px"
  },

  btnDelete: {
    backgroundColor: "#ef4444",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer"
  },

  multiBadge: {
    marginLeft: "8px",
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "10px",
    fontWeight: "bold"
  },

  cardsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px"
  },

  emptyState: {
    gridColumn: "1 / -1",
    padding: "40px",
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    textAlign: "center",
    color: "#94a3b8"
  },

  card: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #334155",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s"
  },

  cardImageContainer: {
    height: "180px",
    width: "100%",
    position: "relative",
    backgroundColor: "#0f172a",
    overflow: "hidden"
  },

  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  cardFavButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor:
      "rgba(15, 23, 42, 0.7)",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  cardMultiBadge: {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    backgroundColor: "#38bdf8",
    color: "#0f172a",
    fontSize: "10px",
    fontWeight: "bold",
    padding: "3px 8px",
    borderRadius: "4px"
  },

  cardBody: {
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    flex: 1
  },

  cardTitle: {
    fontSize: "1.1rem",
    margin: "0 0 8px 0",
    color: "#f8fafc"
  },

  cardGenre: {
    fontSize: "12px",
    color: "#38bdf8",
    margin: "0 0 4px 0"
  },

  cardPlatform: {
    fontSize: "12px",
    color: "#cbd5e1",
    margin: "0 0 12px 0"
  },

  cardFooter: {
    marginTop: "auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "10px",
    borderTop: "1px solid #334155"
  },

  cardPrice: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#22c55e",
    display: "block"
  },

  cardStock: {
    fontSize: "11px",
    color: "#94a3b8",
    display: "block"
  },

  btnQuickView: {
    backgroundColor: "#0284c7",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      "rgba(0, 0, 0, 0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "20px"
  },

  modalContent: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "650px",
    position: "relative",
    padding: "25px",
    border: "1px solid #475569"
  },

  modalCloseButton: {
    position: "absolute",
    top: "15px",
    right: "15px",
    backgroundColor: "transparent",
    border: "none",
    color: "#cbd5e1",
    fontSize: "18px",
    cursor: "pointer"
  },

  modalGrid: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    gap: "20px"
  },

  modalImage: {
    width: "100%",
    height: "280px",
    objectFit: "cover",
    borderRadius: "8px"
  },

  modalInfo: {
    color: "#f8fafc",
    fontSize: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  modalTitle: {
    fontSize: "1.5rem",
    margin: 0,
    color: "#38bdf8"
  },

  modalBadgeRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px"
  },

  modalBadge: {
    backgroundColor: "#334155",
    color: "#cbd5e1",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px"
  },

  modalBadgePrice: {
    backgroundColor: "#22c55e",
    color: "#0f172a",
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "14px"
  }
};

export default App;
