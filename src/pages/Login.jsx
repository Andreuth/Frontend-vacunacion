import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function Login() {
  const [numero_documento, setDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, user, refreshMe } = useAuth();

  const canSubmit = useMemo(() => {
    return numero_documento.trim().length >= 6 && password.trim().length >= 3;
  }, [numero_documento, password]);

  const goByRole = (rol) => {
    if (rol === "ADMIN") navigate("/admin");
    else if (rol === "PEDIATRA") navigate("/pediatric");
    else navigate("/representative");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const r = await login(numero_documento.trim(), password);
    setLoading(false);

    if (!r.ok) {
      setError(r.error || "Error al iniciar sesión");
      return;
    }

    // intenta traer perfil real si existe
    const me = await refreshMe();
    goByRole(me?.rol || user?.rol || "REPRESENTANTE");
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background:
          "radial-gradient(1200px circle at 10% 10%, rgba(13,110,253,.20), transparent 45%)," +
          "radial-gradient(900px circle at 90% 20%, rgba(111,66,193,.20), transparent 45%)," +
          "linear-gradient(180deg, #0b1220 0%, #0a0f1a 100%)",
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center g-3">
          <div className="col-12 col-lg-10">
            <div className="border-0 rounded-4 overflow-hidden shadow-lg bg-white">
              <div className="row g-0">
                {/* Panel institucional (izquierda) */}
                <div
                  className="col-lg-6 p-4 p-lg-5 text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(13,110,253,.95) 0%, rgba(111,66,193,.95) 100%)",
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <div
                      className="rounded-3 d-inline-flex align-items-center justify-content-center"
                      style={{ width: 44, height: 44, background: "rgba(255,255,255,.18)" }}
                    >
                      <i className="bi bi-hospital fs-4"></i>
                    </div>
                    <div>
                      <div className="fw-semibold">Subcentro de Salud</div>
                      <div className="small" style={{ opacity: 0.9 }}>
                        Control de Vacunación Infantil
                      </div>
                    </div>
                  </div>

                  <h2 className="fw-bold mb-2">SISCONI</h2>
                  <div className="mb-3" style={{ opacity: 0.92 }}>
                    Sistema para registrar, monitorear y consultar el esquema de vacunación
                    del niño con historial de atenciones y próximas dosis.
                  </div>

                  <div className="d-flex flex-wrap gap-2 mb-4">
                    <span className="badge rounded-pill text-bg-light">
                      <i className="bi bi-shield-check me-1"></i> Acceso seguro
                    </span>
                    <span className="badge rounded-pill text-bg-light">
                      <i className="bi bi-clipboard2-pulse me-1"></i> Registro clínico
                    </span>
                    <span className="badge rounded-pill text-bg-light">
                      <i className="bi bi-geo-alt me-1"></i> Manta, Ecuador
                    </span>
                  </div>

                  <div className="border-top pt-3" style={{ opacity: 0.95 }}>
                    <div className="small fw-semibold mb-2">Roles del sistema</div>
                    <div className="small d-flex flex-column gap-1">
                      <span>• Administrador: usuarios, vacunas y esquema</span>
                      <span>• Pediatra: registro, visitas y aplicación</span>
                      <span>• Representante: historial y próximas vacunas</span>
                    </div>
                  </div>

                  <div className="mt-4 small" style={{ opacity: 0.9 }}>
                    <div>Proyecto académico — Aplicaciones Web II — ULEAM — 2026</div>
                    <div>Centro de Salud “María Auxiliadora”</div>
                  </div>
                </div>

                {/* Panel Login (derecha) */}
                <div className="col-lg-6 p-4 p-lg-5">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div>
                      <h4 className="mb-1 fw-bold">Iniciar sesión</h4>
                      <div className="text-muted small">
                        Ingresa con tu documento y contraseña.
                      </div>
                    </div>
                    <span className="badge text-bg-dark">
                      <i className="bi bi-lock me-1"></i> Sesión
                    </span>
                  </div>

                  {error && (
                    <div className="alert alert-danger d-flex align-items-start gap-2">
                      <i className="bi bi-exclamation-triangle mt-1"></i>
                      <div>
                        <div className="fw-semibold">No se pudo iniciar sesión</div>
                        <div className="small">{error}</div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-3">
                    <div className="mb-3">
                      <label className="form-label">Número de documento</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-person-vcard"></i>
                        </span>
                        <input
                          className="form-control"
                          placeholder="Ej: 0102030405"
                          value={numero_documento}
                          onChange={(e) => setDocumento(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Contraseña</label>
                      <div className="input-group">
                        <span className="input-group-text">
                          <i className="bi bi-key"></i>
                        </span>
                        <input
                          type={showPass ? "text" : "password"}
                          className="form-control"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPass((v) => !v)}
                          title={showPass ? "Ocultar" : "Mostrar"}
                        >
                          <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`}></i>
                        </button>
                      </div>
                    </div>

                    <button
                      className="btn btn-primary w-100 py-2 fw-semibold"
                      disabled={!canSubmit || loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Ingresando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Entrar
                        </>
                      )}
                    </button>

                  </form>

                  <div className="mt-4 pt-3 border-top text-muted small">
                    Al ingresar aceptas el uso responsable de datos clínicos del paciente.
                  </div>
                </div>
              </div>
            </div>

            {/* Pie (simple, ya lo tienes en el panel izquierdo) */}
          </div>
        </div>
      </div>
    </div>
  );
}
