import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FieldError from '../components/FieldError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { AuthAPI, getErrorMessage, getValidationErrors, isAuthenticatedProfile, toAuthUser } from '../lib/api.js'

export default function SignUp() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || location.state?.returnTo
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e){
    e.preventDefault()
    if (loading) return
    setError('')
    setFieldErrors({})
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
      const data = await AuthAPI.register(payload.fullName, payload.email, payload.password)

      if (data && data.token) {
        const me = await AuthAPI.me(data.token)
        if (!isAuthenticatedProfile(me)) {
          throw new Error('Không thể xác thực hồ sơ người dùng sau khi đăng ký.')
        }

        login(toAuthUser(me, data.token), returnTo)
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
      setFieldErrors(getValidationErrors(err))
      setError(getErrorMessage(err, 'Đăng ký thất bại'))
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
              <FieldError message={fieldErrors.fullName} />
            </label>
            <label className="form-label">Email
              <input className="input" name="email" type="email" placeholder="Enter your email address" required disabled={loading} autoComplete="email" />
              <FieldError message={fieldErrors.email} />
            </label>
            <label className="form-label">Password (min 6 characters)
              <div className="password-field">
                <input className="input" id="signup-pass" name="password" type="password" placeholder="Enter your password" required minLength={6} disabled={loading} autoComplete="new-password" />
                <button type="button" className="icon-btn" onClick={()=>{
                  const el = document.getElementById('signup-pass')
                  if (el) el.type = el.type==='password'?'text':'password'
                }} aria-label="Toggle password visibility">👁️</button>
              </div>
              <FieldError message={fieldErrors.password} />
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
