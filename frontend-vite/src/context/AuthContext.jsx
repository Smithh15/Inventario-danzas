import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  async function login(a, b) {
    // Soporta:
    // login(email, password)
    // login({ token, user })
    if (typeof a === "object" && a?.token && a?.user) {
      const { token: t, user: u } = a;
      setToken(t);
      setUser(u);
      localStorage.setItem("token", t);
      localStorage.setItem("user", JSON.stringify(u));
      return;
    }

    const email = a;
    const password = b;

    const res = await api.post("/auth/login", { email, password });
    const { token: t, user: u } = res.data;

    setToken(t);
    setUser(u);

    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
  }

  function logout() {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  const value = useMemo(
    () => ({ token, user, loading, login, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
