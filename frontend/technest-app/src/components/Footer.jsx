import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="site-footer" style={{marginTop:60}}>
      <div className="container footer-inner" style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,padding:'40px 0'}}>
        <div>
          <Link className="logo" to="/">TechNest</Link>
          <p style={{color:'var(--muted)',marginTop:12}}>Premium tech shopping experience. Discover the latest technology devices and accessories.</p>
        </div>
        <nav className="footer-nav" aria-label="Liên kết nhanh" style={{display:'grid',gap:8}}>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:8}}>Danh mục</h3>
          <Link to="/category/all" style={{color:'var(--muted)',textDecoration:'none'}}>Catalog</Link>
          <Link to="/category/phone" style={{color:'var(--muted)',textDecoration:'none'}}>Phone</Link>
          <Link to="/category/laptop" style={{color:'var(--muted)',textDecoration:'none'}}>Laptop</Link>
          <Link to="/category/screen" style={{color:'var(--muted)',textDecoration:'none'}}>Screen</Link>
          <Link to="/category/headphone" style={{color:'var(--muted)',textDecoration:'none'}}>Headphone</Link>
          <Link to="/category/accessories" style={{color:'var(--muted)',textDecoration:'none'}}>Accessories</Link>
        </nav>
        <div>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:8}}>Liên hệ</h3>
          <p style={{color:'var(--muted)',marginTop:8}}>Email: support@technest.com</p>
          <p style={{color:'var(--muted)'}}>Hotline: 1900-1234</p>
        </div>
      </div>
      <div className="container" style={{padding:'24px 0',borderTop:'1px solid var(--border)',textAlign:'center',color:'var(--muted)'}}>
        © 2025 TechNest. All rights reserved.
      </div>
    </footer>
  )
}
