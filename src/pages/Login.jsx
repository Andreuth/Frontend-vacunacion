import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Login() {
  const [numero_documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // 1) login
      const res = await api.post("/auth/login", { numero_documento, password });
      localStorage.setItem("token", res.data.access_token);

      // 2) traer perfil
      const me = await api.get("/auth/me");
      localStorage.setItem("rol", me.data.rol);
      localStorage.setItem("numero_documento", me.data.numero_documento);

      setUser({ rol: me.data.rol, numero_documento: me.data.numero_documento });

      // 3) redirigir por rol
      if (me.data.rol === "ADMIN") navigate("/admin");
      else if (me.data.rol === "PEDIATRA") navigate("/pediatric");
      else navigate("/representative");
    } catch (err) {
      setError(err?.response?.data?.detail || "Error al iniciar sesión");
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        background: "linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)",
      }}
    >
      <div className="container" style={{ maxWidth: 520 }}>
        {/* Card principal */}
        <div className="card shadow-lg border-0">
          <div className="card-body p-4">

            {/* Header con icono */}
            <div className="text-center mb-4">
              <div
                className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center mb-3"
                style={{ width: 60, height: 60 }}
              >
                <i className="bi bi-shield-check fs-3"></i>
              </div>
              <h3 className="fw-bold mb-1">SISCONI</h3>
              <div className="text-muted">
                Sistema de control de vacunación infantil
              </div>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {/* Formulario */}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Número de documento</label>
                <input
                  className="form-control"
                  placeholder="Ej: 0102030405"
                  value={numero_documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="btn btn-primary w-100 py-2">
                Entrar
              </button>
            </form>

            {/* Info roles */}
            <div className="mt-3 text-muted text-center" style={{ fontSize: 13 }}>
              Acceso para <strong>Administrador</strong>,{" "}
              <strong>Pediatra</strong> y <strong>Representante</strong>
            </div>
          </div>
        </div>

        {/* Footer institucional */}
        <div className="text-center mt-4 text-white" style={{ fontSize: 13 }}>
          <div>
            Proyecto académico — <strong>Aplicaciones Web II</strong> —{" "}
            <strong>ULEAM</strong> — 2026
          </div>
          <div>
            Centro de salud “María Auxiliadora” — Manta, Ecuador
          </div>
        </div>
      </div>
    </div>
  );
}
