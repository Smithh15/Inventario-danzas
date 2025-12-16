import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import InventarioPage from "./pages/InventarioPage.jsx";
import PrestamosPage from "./pages/PrestamosPage.jsx";
import PrestamoDetallePage from "./pages/PrestamoDetallePage.jsx";
import GruposPage from "./pages/GruposPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

import AppHeader from "./components/AppHeader.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user } = useAuth();

  return (
    <div className="app">
      {/* Header SOLO si hay sesión */}
      {user && <AppHeader />}

      <main className="main">
        <Routes>
          <Route path="/" element={<Navigate to={user ? "/inventario" : "/login"} replace />} />

          {/* Público */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegido */}
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <InventarioPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/prestamos"
            element={
              <ProtectedRoute>
                <PrestamosPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/prestamos/:id"
            element={
              <ProtectedRoute>
                <PrestamoDetallePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/grupos"
            element={
              <ProtectedRoute>
                <GruposPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={user ? "/inventario" : "/login"} replace />} />
        </Routes>
      </main>
    </div>
  );
}
