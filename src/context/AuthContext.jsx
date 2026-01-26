import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const LS_TOKEN = "token";
const LS_USER = "user"; // JSON string

function safeJSONParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // {rol, numero_documento, nombres?, apellidos?}
  const [booting, setBooting] = useState(true);

  const isAuthenticated = useMemo(() => !!localStorage.getItem(LS_TOKEN), []);

  const persistUser = (u) => {
    if (!u) {
      localStorage.removeItem(LS_USER);
      setUser(null);
      return;
    }
    localStorage.setItem(LS_USER, JSON.stringify(u));
    setUser(u);
  };

  const refreshMe = async () => {
    const token = localStorage.getItem(LS_TOKEN);
    if (!token) {
      persistUser(null);
      return null;
    }

    // 1) intenta /auth/me
    try {
      const r = await api.get("/auth/me");
      // soporta varias formas de respuesta
      const u = r.data?.user || r.data;
      if (u) {
        persistUser(u);
        return u;
      }
    } catch (_) {
      // sigue al siguiente
    }

    // 2) intenta /users/me
    try {
      const r2 = await api.get("/users/me");
      const u2 = r2.data?.user || r2.data;
      if (u2) {
        persistUser(u2);
        return u2;
      }
    } catch (_) {
      // sigue al fallback
    }

    return null;
  };

  useEffect(() => {
    // Boot: restaurar usuario desde localStorage y luego intentar refresh si hay token
    const token = localStorage.getItem(LS_TOKEN);
    const storedUser = safeJSONParse(localStorage.getItem(LS_USER));

    if (token && storedUser) {
      setUser(storedUser);
    }

    (async () => {
      if (token) {
        const fresh = await refreshMe();
        // si no hay endpoint, al menos mantenemos lo que había guardado
        if (!fresh && !storedUser) {
          // no sabemos rol: default seguro para UI (puedes ajustar)
          persistUser({ rol: "REPRESENTANTE" });
        }
      }
      setBooting(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (numero_documento, password) => {
    try {
      const res = await api.post("/auth/login", { numero_documento, password });
      const token = res.data?.access_token;
      if (!token) return { ok: false, error: "Login inválido: no llegó access_token" };

      localStorage.setItem(LS_TOKEN, token);

      // Si el backend devuelve user en login, lo usamos
      const userFromLogin = res.data?.user;
      if (userFromLogin) {
        persistUser(userFromLogin);
        return { ok: true };
      }

      // Intentar obtener /auth/me o /users/me
      const fresh = await refreshMe();

      // Fallback mínimo si no hay endpoint
      if (!fresh) {
        persistUser({ rol: "REPRESENTANTE", numero_documento });
      }

      return { ok: true };
    } catch (e) {
      const msg = e?.response?.data?.detail || "Credenciales incorrectas o error de servidor";
      return { ok: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER);
    setUser(null);
  };

  const value = {
    user,
    setUser: persistUser, // para que siempre persista
    booting,
    isAuthenticated: !!localStorage.getItem(LS_TOKEN),
    login,
    logout,
    refreshMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
