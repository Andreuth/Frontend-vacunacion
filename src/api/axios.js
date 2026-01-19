import axios from "axios";

const rawBase = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// si estamos en vercel/https, fuerza https
const baseURL =
  window.location.protocol === "https:" ? rawBase.replace("http://", "https://") : rawBase;

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
