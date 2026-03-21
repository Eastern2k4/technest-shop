import { parseJsonSafe } from './http.js'

const RAW_BASE = import.meta.env.VITE_API_URL || ''
const BASE = RAW_BASE.replace(/\/+$/, '')

export function buildApiUrl(path) {
  return path.startsWith('http') ? path : `${BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

export function toAuthUser(profile, token) {
  return {
    id: profile?.id,
    email: profile?.email || '',
    name: profile?.fullName || '',
    fullName: profile?.fullName || '',
    avatarUrl: profile?.avatarUrl || '',
    role: String(profile?.role || '').toUpperCase().replace(/^ROLE_/, ''),
    accessToken: token || null,
  }
}

export function getAccessToken() {
  try {
    const u = JSON.parse(localStorage.getItem('tn_user') || 'null')
    return u?.accessToken ||u?.token || null;
  } catch { return null; }
}

export async function api(path, { method = 'GET', body, headers } = {}) {
  const url = buildApiUrl(path)
  const token = getAccessToken()
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

  const res = await fetch(url, init)
  const data = await parseJsonSafe(res)

  if (!res.ok) {
    const message =
      data?.message ||
      data?.error ||
      data?._raw ||
      res.statusText ||
      `HTTP ${res.status}`

    if (res.status === 401) {
      throw new Error(message || 'Authentication required. Please log in again.')
    } else if (res.status === 403) {
      throw new Error(message || 'You do not have permission to perform this action.')
    }

    throw new Error(message)
  }

  return data
}

export const AuthAPI = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (fullName, email, password) =>
    api('/api/auth/register', { method: 'POST', body: { fullName, email, password } }),
  me: (token) =>
    api('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
}
