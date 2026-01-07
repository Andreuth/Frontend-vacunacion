import { createContext, useState } from "react";
import { setAuthToken } from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    token: null,
    rol: null,
  });

  const login = (token, rol) => {
    setAuth({ token, rol });
    setAuthToken(token);
  };

  const logout = () => {
    setAuth({ token: null, rol: null });
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

