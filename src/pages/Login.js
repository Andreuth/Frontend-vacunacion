import { useState, useContext } from "react";
import API from "../api/api";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const { login } = useContext(AuthContext);
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const form = new FormData();
      form.append("username", numeroDocumento);
      form.append("password", password);

      const res = await API.post("/auth/login", form);

      login(res.data.access_token);
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Error en login:", err);
      setError("Número de documento o contraseña incorrectos");
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2 className="auth-title">Iniciar sesión</h2>
        <p className="auth-subtitle">
          Sistema de control de vacunación
        </p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Número de documento</label>
            <input
              type="text"
              className="form-input"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              placeholder="Ingresa tu número de documento"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button className="btn-primary" type="submit">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
