import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  // The login token lives in an HTTP-only cookie, so the browser has to be
  // told to include cookies with every request.
  withCredentials: true,
});
