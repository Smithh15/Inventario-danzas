import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();

  const Tab = ({ to, children }) => (
    <Link className={pathname === to ? "nav-link active" : "nav-link"} to={to}>
      {children}
    </Link>
  );

  return (
    <header className="header">
      <div className="brand">
        <div className="brand-title">Inventario Danzas</div>
        <div className="brand-sub">Préstamos y control de vestuario</div>
      </div>

      <nav className="nav">
        <Tab to="/inventario">Inventario</Tab>
        <Tab to="/prestamos">Préstamos</Tab>
        <Tab to="/grupos">Grupos</Tab>
      </nav>

      <div className="userbox">
        <div className="usertext">
          <div className="username">{user?.nombre}</div>
          <div className="usersub">{user?.email}</div>
        </div>
        <button className="btn btn-secondary" onClick={logout}>
          Salir
        </button>
      </div>
    </header>
  );
}
