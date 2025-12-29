import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

// Helper: parse JSON an toàn (kể cả khi body rỗng/không phải JSON)
async function parseJsonSafe(res) {
  const ct = res.headers.get('content-type') || ''
  if (res.status === 204) return null
  if (!ct.includes('application/json')) {
    const txt = await res.text()
    return txt ? { _raw: txt } : null
  }
  try { return await res.json() } catch { return null }
}

export default function SignUp() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || location.state?.returnTo
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    if (loading) return
    setError('')
    setSuccess('')
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const email = (fd.get('email') || '').toString().trim()
    const payload = {
      email,
      password: (fd.get('password') || '').toString(),
      fullName: (fd.get('name') || '').toString().trim(), // BE dùng fullName
    }

    try {
      // 1) Đăng ký
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await parseJsonSafe(res)

      if (!res.ok) {
        const msg =
          (data && (data.message || data.error)) ||
          (res.status === 0 ? 'Không thể kết nối máy chủ.' : `Register failed (HTTP ${res.status})`)
        throw new Error(msg)
      }

      // 2) Nếu BE trả token → auto login, ngược lại → điều hướng /signin
      if (data && data.token) {
        // 2.1) Lấy hồ sơ để có role
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
        if (me.authenticated === false) throw new Error('Chưa xác thực người dùng.')

        // 3) Chuẩn hoá user object cho AuthContext
        const user = {
          id: me.id,
          email: me.email,
          name: me.fullName || '',
          fullName: me.fullName || '',                                      // dùng fullName thống nhất
          avatarUrl: me.avatarUrl || '',
          role: String(me.role || '').toUpperCase().replace(/^ROLE_/, ''),  // ADMIN/STAFF/CUSTOMER
          accessToken: data.token,                                          // map token -> accessToken
        }

        login(user, returnTo) // AuthContext sẽ redirect theo role hoặc returnTo
      } else {
        // 2.2) Không có token: coi như đăng ký xong → qua trang đăng nhập
        setSuccess(data?.message || 'Đăng ký thành công. Vui lòng đăng nhập.')
        setTimeout(() => {
          const signInUrl = returnTo ? `/signin?returnTo=${encodeURIComponent(returnTo)}` : '/signin'
          navigate(signInUrl, {
            replace: true,
            state: { notice: 'Đăng ký thành công. Vui lòng đăng nhập.', returnTo }
          })
        }, 800)
      }

    } catch (err) {
      setError(err.message || 'Đăng ký thất bại')
    } finally {
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
          <h1>Create an account</h1>
          <p className="muted">Let's create your account</p>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <form className="form" onSubmit={onSubmit} noValidate>
            <label className="form-label">Full name
              <input className="input" name="name" type="text" placeholder="Enter your full name" required disabled={loading} autoComplete="name" />
            </label>
            <label className="form-label">Email
              <input className="input" name="email" type="email" placeholder="Enter your email address" required disabled={loading} autoComplete="email" />
            </label>
            <label className="form-label">Password (min 6 characters)
              <div className="password-field">
                <input className="input" id="signup-pass" name="password" type="password" placeholder="Enter your password" required minLength={6} disabled={loading} autoComplete="new-password" />
                <button type="button" className="icon-btn" onClick={()=>{
                  const el = document.getElementById('signup-pass')
                  if (el) el.type = el.type==='password'?'text':'password'
                }} aria-label="Toggle password visibility">👁️</button>
              </div>
            </label>
            <button className="btn-primary full" type="submit" disabled={loading}>
              {loading ? 'Đang tạo tài khoản...' : 'Sign Up'}
            </button>
          </form>

          <p className="muted center" style={{marginTop:16}}>
            Already a member? <Link to={returnTo ? `/signin?returnTo=${encodeURIComponent(returnTo)}` : '/signin'} className="link-primary">Sign in</Link>
          </p>
        </section>
      </div>
    </main>
  )
}
