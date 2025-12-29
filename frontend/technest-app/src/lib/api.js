// src/lib/api.js
const RAW_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const BASE = RAW_BASE.replace(/\/+$/, '')

export function buildApiUrl(path) {
  return path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

function getToken() {
  try {
    const u = JSON.parse(localStorage.getItem('tn_user') || 'null');
    return u?.accessToken ||u?.token || null;
  } catch { return null; }
}

export async function api(path, { method = 'GET', body, headers } = {}) {
  const url = buildApiUrl(path)
  const token = getToken();
  
  // Debug logging for order requests
  if (path.includes('/api/orders') && method === 'POST') {
    console.log('[api] Making POST request to:', url)
    console.log('[api] Token present:', !!token)
    if (token) {
      console.log('[api] Token length:', token.length, 'Token preview:', token.substring(0, 20) + '...')
    }
  }
  
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  }

  if (body instanceof FormData) {
    // Browser sets correct headers for FormData
    delete init.headers['Content-Type']
    init.body = body
  } else if (body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const res = await fetch(url, init);

  // Nếu BE trả lỗi có JSON
  if (!res.ok) {
    let err;
    try { 
      const text = await res.text();
      try {
        err = JSON.parse(text);
      } catch {
        // If not JSON, use the text as message
        err = { message: text || res.statusText };
      }
    } catch { 
      err = { message: res.statusText || `HTTP ${res.status}` }; 
    }
    
    // Provide more user-friendly error messages
    if (res.status === 401) {
      err.message = err.message || 'Authentication required. Please log in again.';
    } else if (res.status === 403) {
      err.message = err.message || 'You do not have permission to perform this action.';
    }
    
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  // Có thể có các API trả 204
  if (res.status === 204) return null;
  return res.json();
}

// Cụ thể các auth API
export const AuthAPI = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (name, email, password) => api('/api/auth/register', { method: 'POST', body: { name, email, password } }),
};
