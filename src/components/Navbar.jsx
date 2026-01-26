import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  const a = parts[0]?.[0] || "U";
  const b = parts.length > 1 ? parts[1]?.[0] : "";
  return (a + b).toUpperCase();
}

function RoleBadge({ rol }) {
  const map = {
    ADMIN: "text-bg-primary",
    PEDIATRA: "text-bg-success",
    REPRESENTANTE: "text-bg-warning",
  };
  return <span className={`badge ${map[rol] || "text-bg-secondary"}`}>{rol || ""}</span>;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = user?.rol;

  // Links por rol
  const links = [];
  if (role === "ADMIN") {
    links.push({ to: "/admin", label: "Admin" });
  }
  if (role === "PEDIATRA") {
    links.push({ to: "/pediatric", label: "Pediatría" });
  }
  if (role === "REPRESENTANTE") {
    links.push({ to: "/representative", label: "Mis hijos" });
  }

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + "/");

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container py-2">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-3"
            style={{ width: 34, height: 34, background: "#111", color: "#fff", fontSize: 14 }}
          >
            SC
          </span>
          SISCONI
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#sisconiNav"
          aria-controls="sisconiNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="sisconiNav">
          {/* Menú */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            {links.map((l) => (
              <li className="nav-item" key={l.to}>
                <Link className={`nav-link ${isActive(l.to) ? "fw-semibold" : ""}`} to={l.to}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Sesión */}
          <div className="d-flex align-items-center gap-3">
            {user && (
              <>
                <div className="d-none d-md-flex align-items-center gap-2">
                  <div
                    className="rounded-circle border d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, fontSize: 12 }}
                    title={user?.nombres || "Usuario"}
                  >
                    {initials(user?.nombres || user?.numero_documento || "U")}
                  </div>

                  <div className="d-flex flex-column lh-1">
                    <span className="small fw-semibold">
                      {user?.nombres ? user.nombres : "Sesión activa"}
                    </span>
                    <span className="small text-muted">
                      <RoleBadge rol={user?.rol} />
                    </span>
                  </div>
                </div>

                <button className="btn btn-outline-dark btn-sm" onClick={handleLogout}>
                  Salir
                </button>
              </>
            )}

            {!user && (
              <Link className="btn btn-dark btn-sm" to="/login">
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
