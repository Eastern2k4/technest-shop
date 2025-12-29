import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'

// Prefer Vite proxy in dev (relative path), otherwise use configured API URL
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export default function Home() {
  const { add } = useCart()
  const [products, setProducts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const cats = ['phone', 'laptop', 'screen', 'headphone', 'accessories']
    let completed = 0
    
    cats.forEach(cat => {
      const url = `${API_BASE ? API_BASE : ''}/api/products?cat=${cat}`
      fetch(url)
        .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
        .then(list => Array.isArray(list) ? list : [])
        .then(list => {
          setProducts(prev => ({ ...prev, [cat]: list.slice(0, 4) }))
          completed++
          if (completed === cats.length) setLoading(false)
        })
        .catch(() => {
          setProducts(prev => ({ ...prev, [cat]: [] }))
          completed++
          if (completed === cats.length) setLoading(false)
        })
    })
  }, [])

  const sections = [
    { id: 'phone', title: 'Phone', subtitle: 'Smartphone mới nhất', cat: 'phone', icon: '📱' },
    { id: 'laptop', title: 'Laptop', subtitle: 'Máy tính xách tay', cat: 'laptop', icon: '💻' },
    { id: 'screen', title: 'Screen', subtitle: 'Màn hình chất lượng cao', cat: 'screen', icon: '🖥️' },
    { id: 'headphone', title: 'Headphone', subtitle: 'Âm thanh sống động', cat: 'headphone', icon: '🎧' },
    { id: 'accessories', title: 'Accessory', subtitle: 'Phụ kiện công nghệ', cat: 'accessories', icon: '⌚' }
  ]

  const features = [
    { icon: '🚚', title: 'Miễn phí vận chuyển', desc: 'Cho đơn hàng trên 500.000₫' },
    { icon: '🔒', title: 'Bảo mật thanh toán', desc: '100% an toàn' },
    { icon: '↩️', title: 'Đổi trả dễ dàng', desc: 'Trong vòng 7 ngày' },
    { icon: '💎', title: 'Chính hãng 100%', desc: 'Bảo hành chính thức' }
  ]

  return (
    <main>
      {/* Hero Section */}
      <section className="section hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <h1>Thiết bị công nghệ mới nhất</h1>
            <p>Khám phá smartphone, laptop, màn hình, tai nghe và phụ kiện chính hãng với giá tốt nhất thị trường.</p>
            <div className="hero-actions">
              <Link className="btn-primary" to="/category/all">Mua ngay</Link>
              <Link className="btn-ghost" to="/category/all">Xem tất cả</Link>
            </div>
          </div>
          <div className="hero-media" aria-hidden="true">
  <div className="hero-card">
    <img
      src="https://i.pinimg.com/1200x/a5/a2/75/a5a275a0db7c0c5a6c5e6da6790e6673.jpg"
      alt="Thiết bị công nghệ"
      className="hero-image"
    />
  </div>
</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-item">
                <div className="feature-icon">{feature.icon}</div>
                <div>
                  <h3 style={{fontSize:16,fontWeight:600,margin:'0 0 4px'}}>{feature.title}</h3>
                  <p style={{fontSize:14,color:'var(--muted)',margin:0}}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Danh mục nổi bật</h2>
            <p style={{color:'var(--muted)',marginTop:8}}>Khám phá các sản phẩm công nghệ hàng đầu</p>
          </div>
          <div className="catalog-grid">
            {sections.map(({ cat, title, icon }) => (
              <Link key={cat} className="catalog-card" to={`/category/${cat}`}>
                <div className="catalog-icon">{icon}</div>
                <span>{title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Sections */}
      {sections.map(({ id, title, subtitle, cat, icon }) => (
        products[cat]?.length > 0 && (
          <section key={id} className="section product-section">
            <div className="container">
              <div className="section-head">
                <div>
                  <h2 style={{display:'flex',alignItems:'center',gap:12,margin:0}}>
                    <span>{icon}</span>
                    <span>{title}</span>
                  </h2>
                  <p style={{color:'var(--muted)',marginTop:4,marginBottom:0}}>{subtitle}</p>
                </div>
                <Link className="btn-ghost" to={`/category/${cat}`}>Xem tất cả →</Link>
              </div>
              {loading ? (
                <div style={{textAlign:'center',padding:'40px 0',color:'var(--muted)'}}>Đang tải...</div>
              ) : (
                <div className="product-row">
                  {products[cat].map(p => (
                    <article className="product-card" key={p.id}>
                      <Link className="card-link" to={`/product/${p.id}`}>
                        <div className="product-media">
                          <img src={p.image || p.imageUrl} alt={p.name} />
                        </div>
                        <h3>{p.name}</h3>
                        {(p.descriptionShort || p.specs) && <p style={{fontSize:14,color:'var(--muted)'}}>{p.descriptionShort || p.specs}</p>}
                        <div className="price">{Number(p.price).toLocaleString('vi-VN')}₫</div>
                      </Link>
                      <button className="btn-primary" onClick={() => add(p.id, 1)}>Thêm vào giỏ</button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )
      ))}

      {/* Empty State if no products */}
      {!loading && Object.values(products).every(arr => arr.length === 0) && (
        <section className="section">
          <div className="container" style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:64,marginBottom:16}}>🛍️</div>
            <h2 style={{marginBottom:12}}>Chào mừng đến TechNest</h2>
            <p style={{color:'var(--muted)',marginBottom:24}}>Khám phá các sản phẩm công nghệ mới nhất</p>
            <Link className="btn-primary" to="/category/all">Xem tất cả sản phẩm</Link>
          </div>
        </section>
      )}
    </main>
  )
}
