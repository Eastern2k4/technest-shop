import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'

export default function Header() {
  const { count } = useCart()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Show header when at top
      if (currentScrollY < 10) {
        setIsScrolled(false)
        setIsVisible(true)
      } else {
        setIsScrolled(true)
        // Hide header when scrolling down, show when scrolling up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          setIsVisible(false)
        } else {
          setIsVisible(true)
        }
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <header className={`site-header ${isScrolled ? 'scrolled' : ''} ${!isVisible ? 'hidden' : ''}`}>
      <div className="header-bar container">
        <Link className="logo" to={user?.role === 'ADMIN' ? '/admin' : user?.role === 'STAFF' ? '/staff' : '/'}>TechNest</Link>
        {(!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) && (
          <>
            <nav className="main-nav" aria-label="Chính">
              <ul>
                <li><NavLink to="/category/all" className={({isActive})=>isActive?'active':''}>Catalog</NavLink></li>
                <li><NavLink to="/category/phone" className={({isActive})=>isActive?'active':''}>Phone</NavLink></li>
                <li><NavLink to="/category/laptop" className={({isActive})=>isActive?'active':''}>Laptop</NavLink></li>
                <li><NavLink to="/category/screen" className={({isActive})=>isActive?'active':''}>Screen</NavLink></li>
                <li><NavLink to="/category/headphone" className={({isActive})=>isActive?'active':''}>Headphones</NavLink></li>
                <li><NavLink to="/category/accessories" className={({isActive})=>isActive?'active':''}>Accessories</NavLink></li>
              </ul>
            </nav>
            <form className="header-search" onSubmit={handleSearch}>
              <input
                type="search"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button type="submit" className="search-btn" aria-label="Search">🔍</button>
            </form>
          </>
        )}
        <div className="header-actions">
          {!user && <Link className="btn-header" to="/signin">Đăng nhập</Link>}
          {user && (
            <>
              <Link className="btn-header" to="/profile" style={{textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8}}>
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name || user.fullName || 'User'}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #e5e7eb'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <span 
                  style={{
                    display: user.avatarUrl ? 'none' : 'flex',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 600
                  }}
                >
                  {(user.name || user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
                <span>{user.name || user.fullName}</span>
              </Link>
              <button className="btn-header" onClick={()=>{ logout(); navigate('/') }}>Đăng xuất</button>
            </>
          )}
          {(!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) && (
            <Link className="btn-header btn-cart" to="/cart">Giỏ hàng ({count})</Link>
          )}
        </div>
      </div>
    </header>
  )
}
