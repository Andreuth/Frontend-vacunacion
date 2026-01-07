import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Vacunas from "./pages/Vacunas";
import Centros from "./pages/Centros";
import Personas from "./pages/Personas";
import Historial from "./pages/Historial";

import { AuthProvider, AuthContext } from "./context/AuthContext";

function Protected({ children }) {
  const { auth } = useContext(AuthContext);
  return auth.token ? children : <Navigate to="/" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/vacunas" element={<Protected><Vacunas /></Protected>} />
      <Route path="/centros" element={<Protected><Centros /></Protected>} />
      <Route path="/personas" element={<Protected><Personas /></Protected>} />
      <Route path="/historial" element={<Protected><Historial /></Protected>} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
