import axios from "axios";

const raw = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Fuerza HTTPS cuando el frontend corre en HTTPS (Vercel)
const baseURL =
  window.location.protocol === "https:"
    ? raw.replace(/^http:\/\//, "https://")
    : raw;

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Adjunta token en cada request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Manejo global de 401 (sesión expirada / token inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      // Limpia sesión
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Evita loop si ya estás en login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
