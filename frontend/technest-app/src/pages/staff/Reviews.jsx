import { useEffect, useState } from 'react'
import { ProductsAPI, ReviewsAPI, getErrorMessage } from '../../lib/api.js'

const statusBadgeStyles = {
  pending: {
    background: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffe69c',
  },
  approved: {
    background: '#d1fae5',
    color: '#065f46',
    border: '1px solid #86efac',
  },
}

const actionButtonBaseStyle = {
  padding: '8px 14px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
}

export default function StaffReviews() {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [pendingMap, setPendingMap] = useState({})
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [flashMessage, setFlashMessage] = useState('')
  const [actionReviewId, setActionReviewId] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (selectedProductId) {
      loadReviews(selectedProductId)
    } else {
      setReviews([])
    }
  }, [selectedProductId])

  async function loadProducts() {
    try {
      setError('')
      const [data, pending] = await Promise.all([
        ProductsAPI.list({ cat: 'all' }),
        ReviewsAPI.pendingByProduct(),
      ])

      const list = Array.isArray(data) ? data : []
      const map = {}
      if (Array.isArray(pending)) {
        pending.forEach((entry) => {
          map[entry.productId] = Number(entry.pendingReviews || 0)
        })
      }

      setProducts(list)
      setPendingMap(map)
      setSelectedProductId((currentId) => {
        if (list.length === 0) {
          return null
        }
        return list.some((product) => product.id === currentId) ? currentId : list[0].id
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh sách sản phẩm.'))
      setProducts([])
      setPendingMap({})
    } finally {
      setLoading(false)
    }
  }

  async function loadReviews(productId) {
    try {
      setReviewsLoading(true)
      setActionError('')
      const data = await ReviewsAPI.listManagement(productId)
      setReviews(Array.isArray(data) ? data : [])
    } catch (err) {
      setActionError(getErrorMessage(err, 'Không thể tải danh sách đánh giá.'))
      setReviews([])
    } finally {
      setReviewsLoading(false)
    }
  }

  async function refreshCurrentView(productId = selectedProductId) {
    await Promise.all([
      loadProducts(),
      productId ? loadReviews(productId) : Promise.resolve(),
    ])
  }

  async function approveReview(reviewId, approved) {
    try {
      setActionReviewId(reviewId)
      setActionError('')
      setFlashMessage('')
      const result = await ReviewsAPI.moderate(reviewId, { approved })
      setFlashMessage(result?.message || (approved ? 'Đã duyệt đánh giá.' : 'Đã chuyển đánh giá về chờ duyệt.'))
      await refreshCurrentView()
    } catch (err) {
      setActionError(getErrorMessage(err, 'Không thể cập nhật trạng thái đánh giá.'))
    } finally {
      setActionReviewId(null)
    }
  }

  async function removeReview(reviewId) {
    if (!window.confirm('Xóa đánh giá này khỏi hệ thống?')) {
      return
    }

    try {
      setActionReviewId(reviewId)
      setActionError('')
      setFlashMessage('')
      const result = await ReviewsAPI.remove(reviewId)
      if (replyingTo === reviewId) {
        setReplyingTo(null)
        setReplyText('')
      }
      setFlashMessage(result?.message || 'Đã xóa đánh giá.')
      await refreshCurrentView()
    } catch (err) {
      setActionError(getErrorMessage(err, 'Không thể xóa đánh giá.'))
    } finally {
      setActionReviewId(null)
    }
  }

  async function submitReply(reviewId) {
    if (!replyText.trim()) {
      setActionError('Vui lòng nhập nội dung phản hồi.')
      return
    }

    try {
      setActionReviewId(reviewId)
      setActionError('')
      setFlashMessage('')
      const result = await ReviewsAPI.reply(reviewId, { body: replyText.trim() })
      setReplyingTo(null)
      setReplyText('')
      setFlashMessage(result?.message || 'Đã lưu phản hồi.')
      await refreshCurrentView()
    } catch (err) {
      setActionError(getErrorMessage(err, 'Không thể gửi phản hồi.'))
    } finally {
      setActionReviewId(null)
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>Quản lý đánh giá</h1>

      {error && (
        <div style={messageBoxStyle('#fef2f2', '#b91c1c', '#fecaca')}>
          {error}
        </div>
      )}

      {flashMessage && (
        <div style={messageBoxStyle('#ecfdf5', '#047857', '#a7f3d0')}>
          {flashMessage}
        </div>
      )}

      {actionError && (
        <div style={messageBoxStyle('#fff7ed', '#c2410c', '#fed7aa')}>
          {actionError}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Sản phẩm</h3>
            <button
              onClick={() => refreshCurrentView()}
              style={secondaryButtonStyle}
            >
              Làm mới
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '70vh', overflowY: 'auto' }}>
            {products.map((product) => {
              const pendingReviews = pendingMap[product.id] || 0
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    setFlashMessage('')
                    setActionError('')
                    setSelectedProductId(product.id)
                  }}
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    border: selectedProductId === product.id ? '2px solid #0066cc' : '1px solid var(--border, #eee)',
                    borderRadius: 6,
                    background: selectedProductId === product.id ? '#e6f2ff' : 'white',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  <div style={{ fontWeight: selectedProductId === product.id ? 700 : 500 }}>
                    {product.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    {Number(product.price || 0).toLocaleString('vi-VN')}₫
                  </div>
                  {pendingReviews > 0 && (
                    <div style={{ ...statusChipStyle, ...statusBadgeStyles.pending, marginTop: 8 }}>
                      {pendingReviews} chờ duyệt
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          {!selectedProductId ? (
            <div style={emptyStateStyle}>
              Chưa có sản phẩm để quản lý đánh giá.
            </div>
          ) : reviewsLoading ? (
            <div style={emptyStateStyle}>
              Đang tải đánh giá...
            </div>
          ) : reviews.length === 0 ? (
            <div style={emptyStateStyle}>
              Chưa có đánh giá nào cho sản phẩm này.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {reviews.map((review) => {
                const isPending = !review.isApproved
                const isSubmitting = actionReviewId === review.id

                return (
                  <div
                    key={review.id}
                    style={{
                      background: 'white',
                      padding: 20,
                      borderRadius: 8,
                      border: '1px solid var(--border, #eee)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <div style={avatarStyle}>
                          {(review.userName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                            <strong>{review.userName || 'Anonymous'}</strong>
                            <div style={{ color: '#f59e0b' }}>
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

                      <div style={{ ...statusChipStyle, ...(isPending ? statusBadgeStyles.pending : statusBadgeStyles.approved) }}>
                        {isPending ? 'Chờ duyệt' : 'Đã duyệt'}
                      </div>
                    </div>

                    <div style={{ marginBottom: 16, lineHeight: 1.6 }}>{review.body}</div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {isPending ? (
                        <>
                          <button
                            onClick={() => approveReview(review.id, true)}
                            disabled={isSubmitting}
                            style={primaryButtonStyle}
                          >
                            {isSubmitting ? 'Đang xử lý...' : 'Duyệt đánh giá'}
                          </button>
                          <button
                            onClick={() => removeReview(review.id)}
                            disabled={isSubmitting}
                            style={dangerButtonStyle}
                          >
                            Xóa đánh giá
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setActionError('')
                              setFlashMessage('')
                              setReplyingTo(review.id)
                              setReplyText(review.reply?.body || '')
                            }}
                            disabled={isSubmitting}
                            style={primaryButtonStyle}
                          >
                            {review.reply ? 'Cập nhật phản hồi' : 'Phản hồi đánh giá'}
                          </button>
                          <button
                            onClick={() => approveReview(review.id, false)}
                            disabled={isSubmitting}
                            style={secondaryButtonStyle}
                          >
                            Ẩn khỏi công khai
                          </button>
                          <button
                            onClick={() => removeReview(review.id)}
                            disabled={isSubmitting}
                            style={dangerButtonStyle}
                          >
                            Xóa đánh giá
                          </button>
                        </>
                      )}
                    </div>

                    {review.reply && (
                      <div style={replyBoxStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <strong style={{ color: '#0066cc' }}>Phản hồi từ staff</strong>
                        </div>
                        <div style={{ color: '#333' }}>{review.reply.body}</div>
                      </div>
                    )}

                    {replyingTo === review.id && review.isApproved && (
                      <div style={{ marginTop: 16, padding: 16, background: '#f9fafb', borderRadius: 6 }}>
                        <textarea
                          value={replyText}
                          onChange={(event) => setReplyText(event.target.value)}
                          placeholder="Nhập phản hồi của bạn..."
                          style={{
                            width: '100%',
                            minHeight: 80,
                            padding: 12,
                            border: '1px solid #e5e7eb',
                            borderRadius: 6,
                            fontSize: 14,
                            fontFamily: 'inherit',
                            resize: 'vertical',
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                          <button
                            onClick={() => submitReply(review.id)}
                            disabled={isSubmitting}
                            style={primaryButtonStyle}
                          >
                            {isSubmitting ? 'Đang lưu...' : 'Lưu phản hồi'}
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null)
                              setReplyText('')
                              setActionError('')
                            }}
                            disabled={isSubmitting}
                            style={secondaryButtonStyle}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function messageBoxStyle(background, color, borderColor) {
  return {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    background,
    color,
    border: `1px solid ${borderColor}`,
  }
}

const panelStyle = {
  background: 'var(--bg-secondary, #fafafa)',
  padding: 16,
  borderRadius: 8,
  border: '1px solid var(--border, #eee)',
}

const emptyStateStyle = {
  textAlign: 'center',
  padding: 48,
  background: 'var(--bg-secondary, #fafafa)',
  borderRadius: 8,
  color: 'var(--muted, #666)',
}

const avatarStyle = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: 16,
  fontWeight: 700,
}

const statusChipStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 12,
  fontWeight: 700,
}

const primaryButtonStyle = {
  ...actionButtonBaseStyle,
  background: '#0f766e',
  border: '1px solid #0f766e',
  color: 'white',
}

const secondaryButtonStyle = {
  ...actionButtonBaseStyle,
  background: 'white',
  border: '1px solid #d1d5db',
  color: '#1f2937',
}

const dangerButtonStyle = {
  ...actionButtonBaseStyle,
  background: '#fff1f2',
  border: '1px solid #fecdd3',
  color: '#be123c',
}

const replyBoxStyle = {
  marginTop: 16,
  padding: 12,
  background: 'var(--bg-secondary, #fafafa)',
  borderRadius: 6,
  borderLeft: '3px solid #0066cc',
}
