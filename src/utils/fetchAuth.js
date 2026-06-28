export const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("promain_token");
}

export function getUsuario() {
  const u = localStorage.getItem("promain_usuario");
  return u ? JSON.parse(u) : null;
}

export function logout() {
  localStorage.removeItem("promain_token");
  localStorage.removeItem("promain_usuario");
}

export async function fetchAuth(url, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  if (res.status === 401) {
    logout();
    window.location.hash = "/login";
  }
  return res;
}
