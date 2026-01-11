import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          SISCONI
        </Link>

        <div className="navbar-text text-white me-3">
          {user ? `${user.rol}` : ""}
        </div>

        <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
          Salir
        </button>
      </div>
    </nav>
  );
}
