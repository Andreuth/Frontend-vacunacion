import axios from "axios";

/**
 * Base URL strategy:
 * - Prefer VITE_API_URL (set in .env / Vercel env)
 * - If not set, use a sane default:
 *    - In local dev: http://127.0.0.1:8000
 *    - In production (Vercel/HTTPS): https://back-sisconi.com
 *
 * This avoids "Mixed Content" and CORS headaches.
 */
const envURL = import.meta.env.VITE_API_URL;

const fallback =
  window.location.hostname.includes("vercel.app") || window.location.protocol === "https:"
    ? "https://back-sisconi.com"
    : "http://127.0.0.1:8000";

const baseURL = (envURL || fallback).replace(/\/$/, "");

const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
