import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

export default function StaffReviews() {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [pendingMap, setPendingMap] = useState({})

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      loadReviews(selectedProductId)
    }
  }, [selectedProductId])

  async function loadProducts() {
    try {
      const [data, pending] = await Promise.all([
        api('/api/products?cat=all'),
        api('/api/reviews/pending-by-product')
      ])
      const list = Array.isArray(data) ? data : []
      setProducts(list)
      const map = {}
      if (Array.isArray(pending)) {
        pending.forEach(p => {
          map[p.productId] = Number(p.pendingReplies || 0)
        })
      }
      setPendingMap(map)
      if (list.length > 0 && !selectedProductId) {
        setSelectedProductId(list[0].id)
      }
    } catch (err) {
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadReviews(productId) {
    try {
      const data = await api(`/api/reviews/product/${productId}`)
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading reviews:', err)
      setReviews([])
    }
  }

  async function submitReply(reviewId) {
    if (!replyText.trim()) {
      alert('Vui lòng nhập nội dung phản hồi')
      return
    }

    try {
      await api(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: { body: replyText.trim() }
      })
      alert('Phản hồi đã được gửi thành công!')
      setReplyingTo(null)
      setReplyText('')
      await Promise.all([
        loadReviews(selectedProductId),
        loadProducts()
      ])
    } catch (err) {
      alert('Không thể gửi phản hồi: ' + err.message)
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Quản lý đánh giá</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 24 }}>
        {/* Product List */}
        <div style={{ background: 'var(--bg-secondary, #fafafa)', padding: 16, borderRadius: 8, border: '1px solid var(--border, #eee)' }}>
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Sản phẩm</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh', overflowY: 'auto' }}>
            {products.map(product => (
              <button
                key={product.id}
                onClick={() => setSelectedProductId(product.id)}
                style={{
                  padding: '12px',
                  textAlign: 'left',
                  border: selectedProductId === product.id ? '2px solid #0066cc' : '1px solid var(--border, #eee)',
                  borderRadius: 6,
                  background: selectedProductId === product.id ? '#e6f2ff' : 'white',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                <div style={{ fontWeight: selectedProductId === product.id ? 600 : 400 }}>
                  {product.name}
                </div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                  {Number(product.price || 0).toLocaleString('vi-VN')}₫
                </div>
                {(pendingMap[product.id] || 0) > 0 && (
                  <div style={{
                    marginTop: 6,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fff3cd',
                    color: '#856404',
                    borderRadius: 999,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {pendingMap[product.id]} chưa phản hồi
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div>
          {selectedProductId ? (
            reviews.length === 0 ? (
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
                      background: 'white',
                      padding: 20,
                      borderRadius: 8,
                      border: '1px solid var(--border, #eee)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: 16,
                          fontWeight: 600
                        }}>
                          {(review.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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

                    {/* Existing Reply */}
                    {review.reply ? (
                      <div style={{
                        marginTop: 16,
                        padding: 12,
                        background: 'var(--bg-secondary, #fafafa)',
                        borderRadius: 6,
                        borderLeft: '3px solid #0066cc'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <strong style={{ color: '#0066cc' }}>📝 Phản hồi từ Staff:</strong>
                        </div>
                        <div style={{ color: '#333' }}>{review.reply.body}</div>
                      </div>
                    ) : (
                      /* Reply Form */
                      replyingTo === review.id ? (
                        <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 6 }}>
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Nhập phản hồi của bạn..."
                            style={{
                              width: '100%',
                              minHeight: 80,
                              padding: 12,
                              border: '1px solid #e5e7eb',
                              borderRadius: 6,
                              fontSize: 14,
                              fontFamily: 'inherit',
                              resize: 'vertical'
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            <button
                              className="btn-primary"
                              onClick={() => submitReply(review.id)}
                              style={{ padding: '8px 16px' }}
                            >
                              Gửi phản hồi
                            </button>
                            <button
                              onClick={() => {
                                setReplyingTo(null)
                                setReplyText('')
                              }}
                              style={{
                                padding: '8px 16px',
                                background: 'transparent',
                                border: '1px solid #e5e7eb',
                                borderRadius: 6,
                                cursor: 'pointer'
                              }}
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setReplyingTo(review.id)
                            setReplyText('')
                          }}
                          style={{ padding: '8px 16px', marginTop: 12 }}
                        >
                          Phản hồi đánh giá
                        </button>
                      )
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', padding: 48, color: '#666' }}>
              Chọn sản phẩm để xem đánh giá
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
