import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function ProfesoresPage() {
  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form crear
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "PROFESOR",
  });

  async function cargar() {
    setLoading(true);
    const res = await api.get("/profesores");
    setProfesores(res.data);
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crearProfesor(e) {
    e.preventDefault();
    await api.post("/profesores", form);
    setForm({ nombre: "", email: "", password: "", rol: "PROFESOR" });
    await cargar();
  }

  async function toggleActivo(p) {
    await api.patch(`/profesores/${p.id_profesor}/estado`, {
      activo: p.activo ? 0 : 1,
    });
    await cargar();
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <div className="page">
      <h2 className="title">Profesores / Usuarios</h2>

      {/* Crear */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="subtitle">Crear usuario</h3>

        <form onSubmit={crearProfesor} className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <input
            className="input"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
            required
          />

          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />

          <input
            className="input"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
          />

          <select
            className="input"
            value={form.rol}
            onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value }))}
          >
            <option value="PROFESOR">PROFESOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          <button className="btn" type="submit">
            Crear usuario
          </button>
        </form>
      </div>

      {/* Tabla */}
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Activo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {profesores.map((p) => (
              <tr key={p.id_profesor}>
                <td>{p.id_profesor}</td>
                <td>{p.nombre}</td>
                <td>{p.email}</td>
                <td>{p.rol}</td>
                <td>{p.activo ? "Sí" : "No"}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    onClick={() => toggleActivo(p)}
                  >
                    {p.activo ? "Desactivar" : "Activar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
