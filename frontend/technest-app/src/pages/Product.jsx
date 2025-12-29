import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../lib/api.js'

const API = import.meta.env.VITE_API_URL || ''

export default function Product() {
  const { id } = useParams()
  const { add } = useCart()
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])
  const [recs, setRecs] = useState([])
  const [qty, setQty] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProduct()
    loadReviews()
  }, [id])

  async function loadProduct() {
    try {
      setLoading(true)
      const p = await api(`/api/products/${id}`)
      setProduct(p)
      // Fetch recommendations by categoryId
      if (p.categoryId) {
        const list = await api(`/api/products?categoryId=${p.categoryId}`)
        const products = Array.isArray(list) ? list : []
        setRecs(products.filter(x => x.id !== p.id).slice(0, 8))
      } else {
        const list = await api('/api/products?cat=all')
        const products = Array.isArray(list) ? list : []
        setRecs(products.filter(x => x.id !== p.id).slice(0, 8))
      }
    } catch (err) {
      console.error('Error fetching product:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadReviews() {
    try {
      const data = await api(`/api/reviews/product/${id}`)
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading reviews:', err)
      setReviews([])
    }
  }

  // Reviews are read-only on product page

  if (loading || !product) {
    return (
      <main className="section">
        <div className="container">Đang tải...</div>
      </main>
    )
  }

  const avgRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0

  return (
    <main className="section">
      <div className="container product-detail-extended">
        <div className="pd-gallery">
          <img className="pd-main" src={product.image || product.imageUrl} alt={product.name} />
          <div className="pd-thumbs">
            {[...Array(5)].map((_,i)=>(<img key={i} src={product.image || product.imageUrl} alt="thumb" onClick={e=>{document.querySelector('.pd-main').src=e.target.src}}/>))}
          </div>
        </div>
        <div className="pd-info">
          <div className="pd-title">{product.name}</div>
          <div className="pd-price">{Number(product.price).toLocaleString('vi-VN')}₫</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 16px' }}>
            {reviews.length > 0 ? (
              <>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{avgRating.toFixed(1)}/5</div>
                <div style={{ color: '#ffa500', fontSize: 18 }}>
                  {'⭐'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
                </div>
                <div style={{ color: 'var(--muted, #666)' }}>({reviews.length} đánh giá)</div>
              </>
            ) : (
              <div style={{ color: 'var(--muted, #666)' }}>Chưa có đánh giá</div>
            )}
          </div>
          {product.descriptionShort && <div className="pd-meta" style={{ marginTop: 8, marginBottom: 8 }}>{product.descriptionShort}</div>}
          <p>Hàng chính hãng. Bảo hành 12 tháng.</p>
          <div className="pd-qty">Số lượng <input type="number" min={1} value={qty} onChange={e=>setQty(Number(e.target.value)||1)} /></div>
          <div className="pd-actions">
            <button className="btn-ghost" onClick={()=>history.back()}>Quay lại</button>
            <button className="btn-primary" onClick={()=>add(product.id, qty)}>Thêm vào giỏ</button>
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      {product.descriptionLong && (
        <section className="section" style={{ background: 'var(--bg-secondary, #fafafa)' }}>
          <div className="container">
            <h2 style={{ marginBottom: 16 }}>Chi tiết sản phẩm</h2>
            <div style={{ 
              background: 'var(--bg, #fff)', 
              padding: 24, 
              borderRadius: 8,
              border: '1px solid var(--border, #eee)',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6
            }}>
              {product.descriptionLong}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ margin: 0, marginBottom: 8 }}>Đánh giá sản phẩm</h2>
              {reviews.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 24, fontWeight: 600 }}>{avgRating.toFixed(1)}</div>
                  <div style={{ fontSize: 20 }}>⭐</div>
                  <div style={{ color: 'var(--muted, #666)' }}>({reviews.length} đánh giá)</div>
                </div>
              )}
            </div>
          </div>

          {reviews.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: 48, 
              background: 'var(--bg-secondary, #fafafa)',
              borderRadius: 8,
              color: 'var(--muted, #666)'
            }}>
              Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {reviews.map(review => (
                <div 
                  key={review.id}
                  style={{ 
                    background: 'var(--bg, #fff)', 
                    padding: 20, 
                    borderRadius: 8,
                    border: '1px solid var(--border, #eee)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      {review.userAvatar ? (
                        <img 
                          src={review.userAvatar} 
                          alt={review.userName || 'User'}
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #e5e7eb',
                            flexShrink: 0
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'
                          }}
                        />
                      ) : null}
                      <span 
                        style={{
                          display: review.userAvatar ? 'none' : 'flex',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 16,
                          fontWeight: 600,
                          flexShrink: 0
                        }}
                      >
                        {(review.userName || 'U').charAt(0).toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                          <strong>{review.userName || 'Anonymous'}</strong>
                          <div style={{ color: '#ffa500' }}>
                            {'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                          </div>
                          {review.title && (
                            <span style={{ color: '#666', fontSize: 14 }}>• {review.title}</span>
                          )}
                        </div>
                        {review.createdAt && (
                          <div style={{ fontSize: 12, color: 'var(--muted, #666)' }}>
                            {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 12, lineHeight: 1.6 }}>
                    {review.body}
                  </div>
                  {review.reply && (
                    <div style={{ 
                      marginTop: 16,
                      padding: 12,
                      background: 'var(--bg-secondary, #fafafa)',
                      borderRadius: 6,
                      borderLeft: '3px solid var(--accent, #0066cc)'
                    }}>
                      <div style={{ fontSize: 12, color: 'var(--muted, #666)', marginBottom: 4 }}>
                        Phản hồi từ nhân viên:
                      </div>
                      <div>{review.reply.body}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {recs.length > 0 && (
        <section className="section">
          <div className="container">
            <h2>Có thể bạn cũng thích</h2>
            <div className="grid">
              {recs.map(p => (
                <article className="product-card" key={p.id}>
                  <Link className="card-link" to={`/product/${p.id}`}>
                    <div className="product-media"><img src={p.image || p.imageUrl} alt={p.name} /></div>
                    <h3>{p.name}</h3>
                    {p.descriptionShort && <p>{p.descriptionShort}</p>}
                    <div className="price">{Number(p.price).toLocaleString('vi-VN')}₫</div>
                  </Link>
                  <button className="btn-primary" onClick={()=>add(p.id,1)}>Thêm vào giỏ</button>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
