import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import FieldError from '../components/FieldError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { AuthAPI, getErrorMessage, getValidationErrors, isAuthenticatedProfile, toAuthUser } from '../lib/api.js'

export default function SignIn() {
  const { login } = useAuth()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || location.state?.returnTo
  const [error, setError] = useState(location.state?.notice || '')
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    if (loading) return
    setError('')
    setFieldErrors({})
    setLoading(true)

    const fd = new FormData(e.currentTarget)
    const payload = {
      email: (fd.get('email') || '').toString().trim(),
      password: (fd.get('password') || '').toString()
    }

    try {
      const data = await AuthAPI.login(payload.email, payload.password)
      if (!data?.token) throw new Error('Thiếu token trong phản hồi đăng nhập.')

      const me = await AuthAPI.me(data.token)
      if (!isAuthenticatedProfile(me)) {
        throw new Error('Không thể xác thực hồ sơ người dùng sau khi đăng nhập.')
      }
      login(toAuthUser(me, data.token), returnTo)

    } catch (err) {
      setFieldErrors(getValidationErrors(err))
      setError(getErrorMessage(err, 'Đăng nhập thất bại'))
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
              <FieldError message={fieldErrors.email} />
            </label>
            <label className="form-label">Password
              <div className="password-field">
                <input className="input" id="signin-pass" name="password" type="password" placeholder="••••••••" required disabled={loading} autoComplete="new-password" />
                <button type="button" className="icon-btn" onClick={()=>{
                  const el = document.getElementById('signin-pass')
                  if (el) el.type = el.type==='password'?'text':'password'
                }}>👁️</button>
              </div>
              <FieldError message={fieldErrors.password} />
            </label>
            <button className="btn-primary full" type="submit" disabled={loading}>{loading ? 'Đang đăng nhập…' : 'Sign in'}</button>
          </form>
          <p className="muted center" style={{marginTop:16}}>First time here? <Link to="/signup" className="link-primary">Signup</Link></p>
        </section>
      </div>
    </main>
  )
}
