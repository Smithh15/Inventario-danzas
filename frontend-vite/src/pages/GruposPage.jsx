import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function GruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedGrupo, setSelectedGrupo] = useState(null);

  const [estudiantes, setEstudiantes] = useState([]);
  const [nombreEstudiante, setNombreEstudiante] = useState("");
  const [loadingEst, setLoadingEst] = useState(false);

  async function cargar() {
    setLoading(true);
    const res = await api.get("/grupos"); // ✅ aquí era /grupos
    setGrupos(res.data);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crearGrupo(e) {
    e.preventDefault();
    if (!nombreGrupo.trim()) return;

    await api.post("/grupos", { nombre: nombreGrupo.trim() });
    setNombreGrupo("");
    await cargar();
  }

  async function cargarEstudiantes(id_grupo) {
    setLoadingEst(true);
    try {
      const res = await api.get(`/estudiantes?id_grupo=${id_grupo}`); // ✅ query correcta
      setEstudiantes(res.data);
    } finally {
      setLoadingEst(false);
    }
  }

  async function seleccionarGrupo(g) {
    setSelectedGrupo(g);
    await cargarEstudiantes(g.id_grupo);
  }

  async function crearEstudiante(e) {
    e.preventDefault();
    if (!selectedGrupo) return;
    if (!nombreEstudiante.trim()) return;

    await api.post("/estudiantes", {
      id_grupo: selectedGrupo.id_grupo,
      nombre: nombreEstudiante.trim(),
    });

    setNombreEstudiante("");
    await cargarEstudiantes(selectedGrupo.id_grupo);
  }

  async function toggleEstudianteActivo(est) {
    await api.patch(`/estudiantes/${est.id_estudiante}/estado`, {
      activo: est.activo ? 0 : 1,
    });
    await cargarEstudiantes(selectedGrupo.id_grupo);
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <h2 className="title">Grupos</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="subtitle">Crear grupo</h3>
        <form onSubmit={crearGrupo} className="row" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Nombre del grupo"
            value={nombreGrupo}
            onChange={(e) => setNombreGrupo(e.target.value)}
            required
          />
          <button className="btn" type="submit">
            Crear
          </button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="subtitle">Lista de grupos</h3>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th>Nombre</th>
              <th style={{ width: 140 }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((g) => (
              <tr
                key={g.id_grupo}
                style={{
                  cursor: "pointer",
                  outline:
                    selectedGrupo?.id_grupo === g.id_grupo
                      ? "2px solid rgba(96,165,250,.35)"
                      : "none",
                }}
                onClick={() => seleccionarGrupo(g)}
              >
                <td>{g.id_grupo}</td>
                <td>{g.nombre}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      seleccionarGrupo(g);
                    }}
                  >
                    Ver estudiantes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="help" style={{ marginTop: 10 }}>
          Selecciona un grupo para administrar sus estudiantes.
        </div>
      </div>

      <div className="card">
        <h3 className="subtitle">
          Estudiantes {selectedGrupo ? `— ${selectedGrupo.nombre}` : "(selecciona un grupo)"}
        </h3>

        {!selectedGrupo ? (
          <div className="help">Primero selecciona un grupo arriba.</div>
        ) : (
          <>
            <form onSubmit={crearEstudiante} className="row" style={{ gap: 8, marginBottom: 12 }}>
              <input
                className="input"
                placeholder="Nombre del estudiante"
                value={nombreEstudiante}
                onChange={(e) => setNombreEstudiante(e.target.value)}
                required
              />
              <button className="btn" type="submit">
                Agregar
              </button>
            </form>

            {loadingEst ? (
              <p>Cargando estudiantes...</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: 80 }}>ID</th>
                    <th>Nombre</th>
                    <th style={{ width: 110 }}>Activo</th>
                    <th style={{ width: 160 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((s) => (
                    <tr key={s.id_estudiante}>
                      <td>{s.id_estudiante}</td>
                      <td>{s.nombre}</td>
                      <td>{s.activo ? "Sí" : "No"}</td>
                      <td>
                        <button className="btn btn-secondary" onClick={() => toggleEstudianteActivo(s)}>
                          {s.activo ? "Desactivar" : "Activar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
