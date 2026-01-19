import axios from "axios";

const raw = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// fuerza https cuando el sitio está en https (Vercel)
const baseURL =
  window.location.protocol === "https:" ? raw.replace(/^http:\/\//, "https://") : raw;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
