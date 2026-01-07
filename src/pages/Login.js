import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = new FormData();
      form.append("username", numeroDocumento);
      form.append("password", password);

      const res = await API.post("/auth/login", form);

      login(res.data.access_token, res.data.rol);
      navigate("/dashboard");
    } catch (err) {
      setError("Credenciales incorrectas o usuario no autorizado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container" style={{ maxWidth: 420 }}>
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold mb-1">Sistema de Vacunación</h3>
              <p className="text-muted mb-0">Inicia sesión para continuar</p>
            </div>

            {error && (
              <div className="alert alert-danger py-2" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label">Número de documento</label>
                <input
                  className="form-control"
                  placeholder="Ej: 9999999999"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
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

              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Entrar"}
              </button>
            </form>

            <div className="text-center mt-3">
              <small className="text-muted">
                Tip: Usa tu número de documento y contraseña asignada.
              </small>
            </div>
          </div>
        </div>

        <div className="text-center mt-3">
          <small className="text-muted">
            © {new Date().getFullYear()} - Proyecto ULEAM
          </small>
        </div>
      </div>
    </div>
  );
}

export default Login;
