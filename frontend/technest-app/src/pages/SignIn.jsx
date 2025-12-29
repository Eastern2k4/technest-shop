import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

// Helper: parse JSON an toàn (kể cả khi body rỗng/không phải JSON)
async function parseJsonSafe(res) {
  const ct = res.headers.get('content-type') || ''
  if (res.status === 204) return null
  if (!ct.includes('application/json')) {
    // đọc text để tránh throw và giúp debug nếu cần
    const txt = await res.text()
    return txt ? { _raw: txt } : null
  }
  try { return await res.json() } catch { return null }
}

export default function SignIn() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || location.state?.returnTo
  const [error, setError] = useState(location.state?.notice || '')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const payload = {
      email: (fd.get('email') || '').toString().trim(),
      password: (fd.get('password') || '').toString()
    }

    try {
      // 1) Đăng nhập lấy token
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await parseJsonSafe(res)

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error)) ||
          (res.status === 0 ? 'Không thể kết nối máy chủ.' : `Login failed (HTTP ${res.status})`)
        throw new Error(msg)
      }
      if (!data?.token) throw new Error('Thiếu token trong phản hồi đăng nhập.')

      // 2) Gọi /api/auth/me lấy thông tin & role
      const meRes = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${data.token}` },
      })
      const me = await parseJsonSafe(meRes)
      if (!meRes.ok) {
        const msg =
          (me && (me.message || me.error)) ||
          `Fetch profile failed (HTTP ${meRes.status})`
        throw new Error(msg)
      }
      if (!me) throw new Error('Phản hồi profile rỗng.')

      // 3) Chuẩn hoá user object cho AuthContext
      const user = {
        id: me.id,
        email: me.email,
        name: me.fullName,
        fullName: me.fullName,
        avatarUrl: me.avatarUrl || '',
        role: String(me.role || '').toUpperCase().replace(/^ROLE_/, ''),
        accessToken: data.token,
      }
      login(user, returnTo) // AuthContext sẽ redirect theo role hoặc returnTo

    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại')
      setLoading(false)
    }
  }

  return (
    <main className="section">
      <div className="container auth-grid">
        <div className="auth-brand">
          <div className="brand-logo">TechNest</div>
        </div>
        <section className="auth-card card-elevated animate-slide">
          <h1>Welcome Back</h1>
          <p className="muted">Log in to your account</p>
          {error && <div className="error-msg">{error}</div>}
          <form className="form" onSubmit={onSubmit} noValidate autoComplete="off">
            <label className="form-label">Email
              <input className="input" name="email" type="email" placeholder="you@example.com" required disabled={loading} autoComplete="email" />
            </label>
            <label className="form-label">Password
              <div className="password-field">
                <input className="input" id="signin-pass" name="password" type="password" placeholder="••••••••" required disabled={loading} autoComplete="new-password" />
                <button type="button" className="icon-btn" onClick={()=>{
                  const el = document.getElementById('signin-pass')
                  if (el) el.type = el.type==='password'?'text':'password'
                }}>👁️</button>
              </div>
            </label>
            <button className="btn-primary full" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Sign in'}</button>
          </form>
          <p className="muted center" style={{marginTop:16}}>First time here? <Link to="/signup" className="link-primary">Signup</Link></p>
        </section>
      </div>
    </main>
  )
}
