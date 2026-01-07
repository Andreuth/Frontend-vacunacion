import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

function Navbar() {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = ({ isActive }) =>
    "nav-link" + (isActive ? " active fw-semibold" : "");

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/dashboard">
          🩺 Vacunación
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={linkClass} to="/dashboard">
                Dashboard
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={linkClass} to="/vacunas">
                Vacunas
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={linkClass} to="/centros">
                Centros
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={linkClass} to="/personas">
                Personas
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={linkClass} to="/historial">
                Historial
              </NavLink>
            </li>
          </ul>

          <div className="d-flex align-items-center gap-2">
            <span className="badge text-bg-light text-primary px-3 py-2">
              Rol: <span className="fw-semibold">{auth.rol || "—"}</span>
            </span>

            <button className="btn btn-outline-light" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
