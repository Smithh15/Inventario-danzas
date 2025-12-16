import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";

function fmtDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function PrestamoDetallePage() {
  const { id } = useParams();
  const idPrestamo = Number(id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState(null);

  // devolucionState: { [id_detalle]: { devuelta, perdida, daniada } }
  const [mov, setMov] = useState({});

  async function cargar() {
    setLoading(true);
    try {
      const res = await api.get(`/prestamos/${idPrestamo}`);
      setData(res.data);

      // inicializa controles en 0
      const init = {};
      for (const d of res.data.detalles) {
        init[d.id_detalle] = { devuelta: 0, perdida: 0, daniada: 0 };
      }
      setMov(init);
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Error cargando préstamo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(idPrestamo)) return;
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPrestamo]);

  const prestamo = data?.prestamo;
  const detalles = data?.detalles || [];

  const estado = prestamo?.estado || "";
  const estaCerrado = estado === "CERRADO";

  const canSubmit = useMemo(() => {
    if (estaCerrado) return false;
    // al menos un valor > 0
    for (const k of Object.keys(mov)) {
      const x = mov[k];
      if ((x?.devuelta || 0) + (x?.perdida || 0) + (x?.daniada || 0) > 0) return true;
    }
    return false;
  }, [mov, estaCerrado]);

  function setField(idDetalle, field, value) {
    const n = Number(value || 0);
    setMov((prev) => ({
      ...prev,
      [idDetalle]: {
        ...prev[idDetalle],
        [field]: Number.isFinite(n) ? n : 0,
      },
    }));
  }

  function validacionLocal() {
    // valida que no se pase de lo pendiente por detalle
    for (const d of detalles) {
      const pendiente =
        d.cantidad_prestada -
        (d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada);

      const x = mov[d.id_detalle] || { devuelta: 0, perdida: 0, daniada: 0 };
      const total = (x.devuelta || 0) + (x.perdida || 0) + (x.daniada || 0);

      if (total > pendiente) {
        return `Te pasaste en el detalle #${d.id_detalle}. Pendiente: ${pendiente}`;
      }
      if (x.devuelta < 0 || x.perdida < 0 || x.daniada < 0) {
        return `No se permiten valores negativos (detalle #${d.id_detalle})`;
      }
    }
    return null;
  }

  async function registrarDevolucion() {
    const msg = validacionLocal();
    if (msg) return alert(msg);

    const items = Object.entries(mov)
      .map(([id_detalle, x]) => ({
        id_detalle: Number(id_detalle),
        devuelta: Number(x.devuelta || 0),
        perdida: Number(x.perdida || 0),
        daniada: Number(x.daniada || 0),
      }))
      .filter((x) => x.devuelta + x.perdida + x.daniada > 0);

    if (items.length === 0) return alert("Ingresa al menos una devolución/pérdida/daño.");

    setSaving(true);
    try {
      await api.post(`/prestamos/${idPrestamo}/devolucion`, { items });
      alert("Devolución registrada");
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || err.message || "Error registrando devolución");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="card">
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!prestamo) {
    return (
      <div className="page">
        <div className="card">
          <p>No hay información del préstamo.</p>
          <Link to="/prestamos" className="btn btn-secondary">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="row-between">
        <div>
          <h2 className="title">Préstamo #{prestamo.id_prestamo}</h2>
          <p className="muted">
            Estado: <span className={`pill pill-${estado.toLowerCase()}`}>{estado}</span>
          </p>
        </div>
        <Link to="/prestamos" className="btn btn-secondary">
          Volver
        </Link>
      </div>

      <div className="grid">
        <div className="card">
          <h3 className="subtitle">Datos</h3>

          {/* ✅ Datos generales “humanos” (desde JOIN del backend) */}
          <div className="kv">
            <span>Profesor</span>
            <strong>{prestamo.profesor}</strong>
          </div>
          <div className="kv">
            <span>Grupo</span>
            <strong>{prestamo.grupo}</strong>
          </div>
          <div className="kv">
            <span>Estudiante</span>
            <strong>{prestamo.estudiante}</strong>
          </div>

          {/* Fechas y otros datos */}
          <div className="kv" style={{ marginTop: 10 }}>
            <span>Salida</span>
            <strong>{fmtDate(prestamo.fecha_salida)}</strong>
          </div>
          <div className="kv">
            <span>Estimada devolución</span>
            <strong>{fmtDate(prestamo.fecha_estimada_devolucion)}</strong>
          </div>
          <div className="kv">
            <span>Devolución real</span>
            <strong>{fmtDate(prestamo.fecha_devolucion_real)}</strong>
          </div>

          {prestamo.observaciones ? (
            <div style={{ marginTop: 10 }}>
              <div className="k">Observaciones</div>
              <div className="note">{prestamo.observaciones}</div>
            </div>
          ) : null}
        </div>

        <div className="card">
          <h3 className="subtitle">Detalle y devolución</h3>

          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Detalle</th>
                  <th>Vestuario</th>
                  <th>Prestada</th>
                  <th>Devuelta</th>
                  <th>Perdida</th>
                  <th>Dañada</th>
                  <th>Pendiente</th>

                  {/* ✅ Reemplaza “Registrar ahora” por columnas claras */}
                  <th>Devuelta</th>
                  <th>Perdida</th>
                  <th>Dañada</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d) => {
                  const pendiente =
                    d.cantidad_prestada -
                    (d.cantidad_devuelta + d.cantidad_perdida + d.cantidad_daniada);

                  const x = mov[d.id_detalle] || { devuelta: 0, perdida: 0, daniada: 0 };

                  return (
                    <tr key={d.id_detalle}>
                      <td>#{d.id_detalle}</td>
                      <td>
                        <div style={{ display: "grid" }}>
                          <span className="strong">
                            {d.vestuario?.nombre || `ID ${d.id_vestuario}`}
                          </span>
                          <span className="muted small">
                            {d.vestuario?.tipo || ""}{" "}
                            {d.vestuario?.talla ? `· ${d.vestuario.talla}` : ""}
                          </span>
                        </div>
                      </td>

                      <td>{d.cantidad_prestada}</td>
                      <td>{d.cantidad_devuelta}</td>
                      <td>{d.cantidad_perdida}</td>
                      <td>{d.cantidad_daniada}</td>
                      <td className={pendiente === 0 ? "ok" : ""}>{pendiente}</td>

                      {/* ✅ Inputs separados por columna, con placeholder completo */}
                      <td>
                        <input
                          className="input num"
                          type="number"
                          min="0"
                          disabled={estaCerrado || pendiente === 0}
                          value={x.devuelta}
                          onChange={(e) => setField(d.id_detalle, "devuelta", e.target.value)}
                          placeholder="Devuelta"
                        />
                      </td>
                      <td>
                        <input
                          className="input num"
                          type="number"
                          min="0"
                          disabled={estaCerrado || pendiente === 0}
                          value={x.perdida}
                          onChange={(e) => setField(d.id_detalle, "perdida", e.target.value)}
                          placeholder="Perdida"
                        />
                      </td>
                      <td>
                        <input
                          className="input num"
                          type="number"
                          min="0"
                          disabled={estaCerrado || pendiente === 0}
                          value={x.daniada}
                          onChange={(e) => setField(d.id_detalle, "daniada", e.target.value)}
                          placeholder="Dañada"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ Texto de ayuda debajo del bloque */}
          <p className="help" style={{ marginTop: 10 }}>
            Registra únicamente lo que se devuelve hoy.
            <br />
            El sistema calculará lo pendiente automáticamente.
          </p>

          <div className="row-between" style={{ marginTop: 12 }}>
            <p className="muted small">
              Si el préstamo queda en pendiente, pasará a <b>PARCIAL</b>. Cuando todo esté procesado,
              pasa a <b>CERRADO</b>.
            </p>

            <button
              className="btn"
              onClick={registrarDevolucion}
              disabled={!canSubmit || saving}
              title={estaCerrado ? "Este préstamo ya está cerrado" : ""}
            >
              {saving ? "Guardando..." : "Registrar devolución"}
            </button>
          </div>

          {estaCerrado ? (
            <p className="ok small" style={{ marginTop: 10 }}>
              Este préstamo está cerrado. No puedes registrar más movimientos.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
