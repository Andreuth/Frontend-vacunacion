import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!localStorage.getItem("token")) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.rol)) return <Navigate to="/" />;

  return children;
}
