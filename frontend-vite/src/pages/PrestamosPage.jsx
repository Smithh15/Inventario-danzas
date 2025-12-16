import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Link } from "react-router-dom";

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [fGrupo, setFGrupo] = useState(""); // id_grupo
  const [fEstado, setFEstado] = useState(""); // ABIERTO/PARCIAL/CERRADO
  const [fEstudiante, setFEstudiante] = useState(""); // id_estudiante

  async function cargar() {
    try {
      setLoading(true);

      const [prestRes, gruposRes, estudiantesRes] = await Promise.all([
        api.get("/prestamos"),
        api.get("/grupos"),
        api.get("/estudiantes"),
      ]);

      setPrestamos(prestRes.data);
      setGrupos(gruposRes.data);
      setEstudiantes(estudiantesRes.data);
    } catch (err) {
      console.error("Error cargando datos", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  // Mapas rápidos para mostrar nombres aunque vengan ids
  const gruposMap = useMemo(() => {
    const m = new Map();
    grupos.forEach((g) => m.set(String(g.id_grupo), g.nombre));
    return m;
  }, [grupos]);

  const estudiantesMap = useMemo(() => {
    const m = new Map();
    estudiantes.forEach((s) => m.set(String(s.id_estudiante), s.nombre));
    return m;
  }, [estudiantes]);

  // ✅ Mejora UX: estudiantes filtrables según grupo seleccionado
  const estudiantesFiltrables = useMemo(() => {
    if (!fGrupo) return estudiantes;
    return estudiantes.filter((s) => String(s.id_grupo) === String(fGrupo));
  }, [estudiantes, fGrupo]);

  // Lista filtrada
  const filtrados = useMemo(() => {
    return prestamos.filter((p) => {
      const pidGrupo = p.id_grupo ?? p.grupo_id;
      const pidEst = p.id_estudiante ?? p.estudiante_id;

      if (fGrupo && String(pidGrupo) !== String(fGrupo)) return false;
      if (fEstado && String(p.estado) !== String(fEstado)) return false;
      if (fEstudiante && String(pidEst) !== String(fEstudiante)) return false;

      return true;
    });
  }, [prestamos, fGrupo, fEstado, fEstudiante]);

  function limpiarFiltros() {
    setFGrupo("");
    setFEstado("");
    setFEstudiante("");
  }

  return (
    <div className="page">
      <h1 className="title">Préstamos</h1>

      {/* Barra de filtros */}
      <div className="filtersBar">
        <div className="filtersLeft">
          <select
            className="select"
            value={fGrupo}
            onChange={(e) => {
              setFGrupo(e.target.value);
              setFEstudiante(""); // ✅ si cambia grupo, resetea estudiante
            }}
          >
            <option value="">Todos los grupos</option>
            {grupos.map((g) => (
              <option key={g.id_grupo} value={g.id_grupo}>
                {g.nombre}
              </option>
            ))}
          </select>

          <select
            className="select"
            value={fEstado}
            onChange={(e) => setFEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="ABIERTO">ABIERTO</option>
            <option value="PARCIAL">PARCIAL</option>
            <option value="CERRADO">CERRADO</option>
          </select>

          <select
            className="select"
            value={fEstudiante}
            onChange={(e) => setFEstudiante(e.target.value)}
          >
            <option value="">Todos los estudiantes</option>
            {estudiantesFiltrables.map((s) => (
              <option key={s.id_estudiante} value={s.id_estudiante}>
                {s.nombre}
              </option>
            ))}
          </select>

          <button className="btn btn-secondary" type="button" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>

        <div className="filtersRight">
          <span className="muted">Mostrando:</span>
          <span className="pill">{filtrados.length}</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 80 }}>ID</th>
                <th>Profesor</th>
                <th>Grupo</th>
                <th>Estudiante</th>
                <th>Salida</th>
                <th style={{ width: 120 }}>Estado</th>
                <th style={{ width: 110 }}>Pendiente</th>
                <th style={{ width: 90 }}>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const pidGrupo = p.id_grupo ?? p.grupo_id;
                const pidEst = p.id_estudiante ?? p.estudiante_id;

                const grupoNombre =
                  p.grupo || gruposMap.get(String(pidGrupo)) || pidGrupo || "-";
                const estudianteNombre =
                  p.estudiante || estudiantesMap.get(String(pidEst)) || pidEst || "-";

                return (
                  <tr key={p.id_prestamo}>
                    <td>{p.id_prestamo}</td>
                    <td>{p.profesor || "-"}</td>
                    <td>{grupoNombre}</td>
                    <td>{estudianteNombre}</td>
                    <td>{p.fecha_salida ? new Date(p.fecha_salida).toLocaleString() : ""}</td>
                    <td>
                      <span className="badge ok">{p.estado}</span>
                    </td>
                    <td>{p.pendientes ?? "-"}</td>
                    <td>
                      <Link to={`/prestamos/${p.id_prestamo}`}>Ver</Link>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: 16 }}>
                    No hay préstamos con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
