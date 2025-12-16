import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("profesor@danzas.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErrMsg("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      // res.data = { token, user }
      login(res.data); // guarda token + user en localStorage y estado
      navigate("/inventario", { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "No se pudo iniciar sesión";
      setErrMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
      <div className="card" style={{ width: "min(520px, 92vw)" }}>
        <h1 className="title" style={{ marginBottom: 8 }}>Iniciar sesión</h1>
        <p style={{ marginTop: 0, opacity: 0.85 }}>
          Ingresa con tu correo y contraseña.
        </p>

        <form onSubmit={onSubmit} className="grid" style={{ marginTop: 12 }}>
          <label>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Correo</div>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@danzas.com"
              autoComplete="username"
              required
            />
          </label>

          <label>
            <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 6 }}>Contraseña</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {errMsg && (
            <div className="card" style={{ padding: 10, border: "1px solid rgba(255,255,255,0.15)" }}>
              <strong style={{ display: "block", marginBottom: 4 }}>Error</strong>
              <span style={{ opacity: 0.9 }}>{errMsg}</span>
            </div>
          )}

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
