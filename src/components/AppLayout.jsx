import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function NavItem({ to, label, icon }) {
  const loc = useLocation();
  const active = loc.pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={`list-group-item list-group-item-action d-flex align-items-center gap-2 ${active ? "active" : ""}`}
      style={{ borderRadius: 12, marginBottom: 8 }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function AppLayout({ title, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const role = user?.rol;

  const doLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="container-fluid" style={{ minHeight: "100vh", background: "#f6f8fb" }}>
      <div className="row g-0">
        <aside className="col-12 col-lg-3 col-xl-2 p-3">
          <div className="p-3 bg-white shadow-sm" style={{ borderRadius: 16 }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <div className="fw-bold">SISCONI</div>
                <div className="text-muted" style={{ fontSize: 12 }}>
                  {role ? `Rol: ${role}` : "—"}
                </div>
              </div>
              <button className="btn btn-sm btn-outline-secondary" onClick={doLogout}>
                Salir
              </button>
            </div>

            <div className="list-group list-group-flush">
              {role === "ADMIN" && (
                <>
                  <NavItem to="/admin" label="Panel Admin" icon="🛠️" />
                  <NavItem to="/pediatric" label="Vista Pediatra" icon="🩺" />
                  <NavItem to="/representative" label="Vista Representante" icon="👨‍👩‍👧" />
                </>
              )}

              {role === "PEDIATRA" && (
                <>
                  <NavItem to="/pediatric" label="Panel Pediatra" icon="🩺" />
                </>
              )}

              {role === "REPRESENTANTE" && (
                <>
                  <NavItem to="/representative" label="Mis hijos" icon="👨‍👩‍👧" />
                </>
              )}
            </div>

            <hr />

            <div className="text-muted" style={{ fontSize: 12 }}>
              Centro de salud “María Auxiliadora” — Manta
            </div>
          </div>
        </aside>

        <main className="col-12 col-lg-9 col-xl-10 p-3 p-lg-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="m-0">{title}</h4>
            <div className="text-muted" style={{ fontSize: 12 }}>
              {new Date().toLocaleString()}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
