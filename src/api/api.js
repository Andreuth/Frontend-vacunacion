import axios from "axios";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

API.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default API;
