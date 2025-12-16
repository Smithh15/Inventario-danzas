import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

export default function InventarioPage() {
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  // Reporte resumen
  const [reporte, setReporte] = useState({ resumen: [], totales: null });

  // ===== CREAR VESTUARIO =====
  const [nuevo, setNuevo] = useState({
    nombre: "",
    tipo: "",
    talla: "",
    cantidad_total: 1,
  });

  // ===== CREAR PRÉSTAMO (AHORA: estudiante obligatorio) =====
  const [prestamo, setPrestamo] = useState({
    id_grupo: "",
    id_estudiante: "",
    fecha_estimada_devolucion: "",
    observaciones: "",
    items: [{ id_vestuario: "", cantidad: 1 }],
  });

  async function cargarBase() {
    const [vestuarioRes, gruposRes, repRes] = await Promise.all([
      api.get("/vestuario"),
      api.get("/grupos"),
      api.get("/reportes/inventario-por-grupo"),
    ]);

    setItems(vestuarioRes.data);
    setGrupos(gruposRes.data);
    setReporte(repRes.data);
  }

  async function cargarEstudiantesGrupo(id_grupo) {
    if (!id_grupo) {
      setEstudiantes([]);
      return;
    }
    const res = await api.get(`/estudiantes?id_grupo=${Number(id_grupo)}`);
    // solo activos para prestar
    setEstudiantes(res.data.filter((e) => Number(e.activo) === 1));
  }

  async function cargar() {
    setLoading(true);
    try {
      await cargarBase();
      // si ya hay grupo seleccionado, refresca estudiantes
      if (prestamo.id_grupo) await cargarEstudiantesGrupo(prestamo.id_grupo);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================
  // CREAR VESTUARIO
  // ==========================
  async function crearVestuario(e) {
    e.preventDefault();

    await api.post("/vestuario", {
      ...nuevo,
      cantidad_total: Number(nuevo.cantidad_total),
    });

    setNuevo({ nombre: "", tipo: "", talla: "", cantidad_total: 1 });
    await cargar();
  }

  // ==========================
  // PRESTAMO ITEMS
  // ==========================
  function updatePrestamoItem(idx, key, value) {
    const copy = structuredClone(prestamo);
    copy.items[idx][key] = value;
    setPrestamo(copy);
  }

  function addPrestamoItem() {
    setPrestamo((p) => ({
      ...p,
      items: [...p.items, { id_vestuario: "", cantidad: 1 }],
    }));
  }

  function removePrestamoItem(idx) {
    setPrestamo((p) => ({
      ...p,
      items: p.items.filter((_, i) => i !== idx),
    }));
  }

  // ==========================
  // CREAR PRÉSTAMO
  // ==========================
  async function crearPrestamo(e) {
    e.preventDefault();

    try {
      if (!prestamo.id_grupo) {
        alert("Selecciona un grupo.");
        return;
      }
      if (!prestamo.id_estudiante) {
        alert("Selecciona un estudiante.");
        return;
      }

      // ✅ Backend espera: const { id_grupo, id_estudiante, items } = req.body;
      const payload = {
        id_grupo: Number(prestamo.id_grupo),
        id_estudiante: Number(prestamo.id_estudiante),
        fecha_estimada_devolucion: prestamo.fecha_estimada_devolucion || null,
        observaciones: prestamo.observaciones || null,
        items: prestamo.items.map((it) => ({
          id_vestuario: Number(it.id_vestuario),
          cantidad: Number(it.cantidad),
        })),
      };

      const res = await api.post("/prestamos", payload);
      alert(`Préstamo creado. ID: ${res.data.prestamo_id}`);

      setPrestamo({
        id_grupo: "",
        id_estudiante: "",
        fecha_estimada_devolucion: "",
        observaciones: "",
        items: [{ id_vestuario: "", cantidad: 1 }],
      });

      setEstudiantes([]);
      await cargar();
    } catch (err) {
      alert(err?.response?.data?.message || "Error creando préstamo");
    }
  }

  // ==========================
  // Resumen agrupado para UI
  // ==========================
  const resumenPorGrupo = useMemo(() => {
    const map = new Map();
    for (const r of reporte?.resumen || []) {
      const key = `${r.id_grupo}|${r.grupo}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(r);
    }
    return Array.from(map.entries()).map(([k, rows]) => {
      const [id_grupo, grupo] = k.split("|");
      const totalPrestadas = rows.reduce((acc, x) => acc + Number(x.prestadas || 0), 0);
      return { id_grupo: Number(id_grupo), grupo, totalPrestadas, rows };
    });
  }, [reporte]);

  // ==========================
  // RENDER
  // ==========================
  return (
    <div className="page">
      <h1 className="title">Inventario</h1>

      {/* ============ RESUMEN POR GRUPO ============ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="subtitle">Resumen de préstamos por grupo</h2>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <div className="help" style={{ marginBottom: 10 }}>
              Se cuentan únicamente préstamos en estado ABIERTO o PARCIAL.
            </div>

            {resumenPorGrupo.length === 0 ? (
              <div className="help">No hay prendas prestadas actualmente.</div>
            ) : (
              <div className="grid" style={{ gap: 12 }}>
                {resumenPorGrupo.map((g) => (
                  <div key={g.id_grupo} className="card" style={{ margin: 0 }}>
                    <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                      <strong>{g.grupo}</strong>
                      <span className="badge warn">{g.totalPrestadas} prestadas</span>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Vestuario</th>
                            <th style={{ width: 120 }}>Prestadas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.rows.map((r) => (
                            <tr key={`${r.id_grupo}-${r.id_vestuario}`}>
                              <td>{r.vestuario}</td>
                              <td>{r.prestadas}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reporte?.totales && (
              <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                <span className="badge">{Number(reporte.totales.total_general || 0)} total</span>
                <span className="badge ok">{Number(reporte.totales.disponibles || 0)} disponibles</span>
                <span className="badge warn">{Number(reporte.totales.prestadas || 0)} prestadas</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ================= TABLA INVENTARIO ================= */}
      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Talla</th>
                <th>Total</th>
                <th>Disponible</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v) => (
                <tr key={v.id_vestuario}>
                  <td>{v.id_vestuario}</td>
                  <td>{v.nombre}</td>
                  <td>{v.tipo}</td>
                  <td>{v.talla}</td>
                  <td>{v.cantidad_total}</td>
                  <td>{v.cantidad_disponible}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= CREAR VESTUARIO ================= */}
      <div className="card">
        <h2 className="subtitle">Crear vestuario</h2>

        <form onSubmit={crearVestuario} className="grid">
          <input
            className="input"
            placeholder="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo((p) => ({ ...p, nombre: e.target.value }))}
            required
          />

          <div className="row" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="Tipo"
              value={nuevo.tipo}
              onChange={(e) => setNuevo((p) => ({ ...p, tipo: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Talla"
              value={nuevo.talla}
              onChange={(e) => setNuevo((p) => ({ ...p, talla: e.target.value }))}
            />
            <input
              className="input num"
              type="number"
              min="1"
              value={nuevo.cantidad_total}
              onChange={(e) => setNuevo((p) => ({ ...p, cantidad_total: e.target.value }))}
              required
            />
          </div>

          <button className="btn">Guardar vestuario</button>
        </form>
      </div>

      {/* ================= CREAR PRÉSTAMO ================= */}
      <div className="card">
        <h2 className="subtitle">Crear préstamo</h2>

        <form onSubmit={crearPrestamo} className="grid">
          {/* Grupo */}
          <select
            className="input"
            value={prestamo.id_grupo}
            onChange={async (e) => {
              const id_grupo = e.target.value;
              setPrestamo((p) => ({ ...p, id_grupo, id_estudiante: "" }));
              await cargarEstudiantesGrupo(id_grupo);
            }}
            required
          >
            <option value="">Seleccione grupo</option>
            {grupos.map((g) => (
              <option key={g.id_grupo} value={g.id_grupo}>
                {g.nombre}
              </option>
            ))}
          </select>

          {/* ✅ Estudiante DEPENDE del grupo (snippet exacto) */}
          <select
            className="input"
            value={prestamo.id_estudiante}
            onChange={(e) =>
              setPrestamo((p) => ({ ...p, id_estudiante: e.target.value }))
            }
            required
            disabled={!prestamo.id_grupo}
          >
            <option value="">Seleccione estudiante</option>
            {estudiantes
              .filter((e) => e.activo)
              .map((e) => (
                <option key={e.id_estudiante} value={e.id_estudiante}>
                  {e.nombre}
                </option>
              ))}
          </select>

          {/* Fecha (no pasada) */}
          <input
            className="input"
            type="date"
            min={hoyISO()}
            value={prestamo.fecha_estimada_devolucion}
            onChange={(e) => setPrestamo((p) => ({ ...p, fecha_estimada_devolucion: e.target.value }))}
          />

          {/* Observaciones */}
          <textarea
            className="input"
            placeholder="Observaciones"
            value={prestamo.observaciones}
            onChange={(e) => setPrestamo((p) => ({ ...p, observaciones: e.target.value }))}
          />

          {/* Items */}
          <div>
            <strong>Vestuario prestado</strong>

            {prestamo.items.map((it, idx) => (
              <div key={idx} className="row" style={{ gap: 8, marginTop: 8 }}>
                <select
                  className="input"
                  value={it.id_vestuario}
                  onChange={(e) => updatePrestamoItem(idx, "id_vestuario", e.target.value)}
                  required
                >
                  <option value="">Seleccione vestuario</option>
                  {items.map((v) => (
                    <option key={v.id_vestuario} value={v.id_vestuario} disabled={v.cantidad_disponible <= 0}>
                      {v.nombre} (Disp: {v.cantidad_disponible})
                    </option>
                  ))}
                </select>

                <input
                  className="input num"
                  type="number"
                  min="1"
                  value={it.cantidad}
                  onChange={(e) => updatePrestamoItem(idx, "cantidad", e.target.value)}
                  required
                />

                {prestamo.items.length > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={() => removePrestamoItem(idx)}>
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={addPrestamoItem}>
              + Agregar otro vestuario
            </button>
          </div>

          <button className="btn">Crear préstamo</button>
        </form>
      </div>
    </div>
  );
}
