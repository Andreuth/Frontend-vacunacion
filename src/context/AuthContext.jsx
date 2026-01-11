import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {rol, numero_documento}

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    const numero_documento = localStorage.getItem("numero_documento");
    if (token && rol) setUser({ rol, numero_documento });
  }, []);

  const login = async (numero_documento, password) => {
    const res = await api.post("/auth/login", { numero_documento, password });
    localStorage.setItem("token", res.data.access_token);

    // 🔥 Para saber el rol, necesitamos un endpoint /auth/me o /users/me
    // Por ahora lo dejamos pendiente y lo implementamos ya mismo en el backend.
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("numero_documento");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
