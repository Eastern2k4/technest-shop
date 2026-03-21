import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api, toAuthUser } from '../lib/api.js'

export default function Profile() {
  const { user, setAuthUser } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    addressText: '',
    avatarUrl: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Thêm state cho đơn hàng
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [orderError, setOrderError] = useState(null)
  const [openOrderId, setOpenOrderId] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', body: '' })
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/signin')
      return
    }
    loadProfile()
  }, [user])

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)
      const data = await api('/api/auth/me')
      setProfile(data)
      setFormData({
        fullName: data.fullName || '',
        username: data.username || data.email || '',
        email: data.email || '',
        phone: data.phone || '',
        addressText: data.addressText || '',
        avatarUrl: data.avatarUrl || '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      console.error('Error loading profile:', err)
      setError(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function loadOrders() {
    if (!user) return
    try {
      setOrderError(null)
      setLoadingOrders(true)
      const data = await api('/api/orders/me')
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading orders:', err)
      setOrderError('Không thể tải đơn hàng')
    } finally {
      setLoadingOrders(false)
    }
  }

  async function markDelivered(orderId) {
    try {
      setOrderError(null)
      await api(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status: 'DELIVERED' }
      })
      await loadOrders()
    } catch (err) {
      console.error('Error updating order status:', err)
      setOrderError(err.message || 'Không thể cập nhật trạng thái đơn hàng')
    }
  }

  async function submitReview(productId) {
    if (!reviewForm.body.trim()) {
      setOrderError('Vui lòng nhập nội dung đánh giá')
      return
    }
    try {
      setReviewLoading(true)
      await api(`/api/reviews/product/${productId}`, {
        method: 'POST',
        body: reviewForm
      })
      setSuccess('Đánh giá đã được gửi thành công!')
      setReviewTarget(null)
      setReviewForm({ rating: 5, title: '', body: '' })
    } catch (err) {
      setOrderError(err.message || 'Không thể gửi đánh giá')
    } finally {
      setReviewLoading(false)
    }
  }

  // Load lịch sử đơn hàng của user
  useEffect(() => {
    if (!user) return

    loadOrders()
  }, [user])

  function startEdit() {
    setEditing(true)
    setFormData({
      fullName: profile?.fullName || user?.fullName || user?.name || '',
      username: profile?.username || user?.email || '',
      email: profile?.email || user?.email || '',
      phone: profile?.phone || '',
      addressText: profile?.addressText || '',
      avatarUrl: profile?.avatarUrl || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }

  function cancelEdit() {
    setEditing(false)
      setFormData({
        fullName: profile?.fullName || '',
        username: profile?.username || profile?.email || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        addressText: profile?.addressText || '',
        avatarUrl: profile?.avatarUrl || '',
        newPassword: '',
        confirmPassword: ''
      })
    setError(null)
    setSuccess(null)
  }

  async function saveProfile(e) {
    e.preventDefault()
    try {
      setError(null)
      setSuccess(null)

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match')
          return
        }
        if (formData.newPassword.length < 6) {
          setError('New password must be at least 6 characters')
          return
        }
      }

      // Handle avatar URL - if it's a base64 data URL, truncate it or use a placeholder
      let avatarUrl = formData.avatarUrl.trim()
      // If it's a very long base64 string, we might need to handle it differently
      // For now, we'll just send it as is, but limit the length
      if (avatarUrl.startsWith('data:image') && avatarUrl.length > 10000) {
        // If base64 is too long, keep only first part or use a placeholder
        console.warn('Avatar URL is very long, truncating...')
        avatarUrl = avatarUrl.substring(0, 10000) // Limit to 10k chars
      }

      const updates = {
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        phone: formData.phone.trim(),
        addressText: formData.addressText.trim(),
        avatarUrl: avatarUrl
      }

      if (formData.newPassword) {
        updates.newPassword = formData.newPassword
      }

      console.log('[Profile] Sending update request:', { 
        ...updates, 
        avatarUrl: updates.avatarUrl ? updates.avatarUrl.substring(0, 50) + '...' : null 
      })
      
      const response = await api('/api/auth/me', {
        method: 'PUT',
        body: updates
      })

      console.log('[Profile] Update response:', response)

      setAuthUser(toAuthUser({
        ...response,
        email: response.email || user?.email,
      }, user?.accessToken || user?.token))

      setSuccess(response.message || 'Profile updated successfully!')

      await loadProfile()
      setEditing(false)
    } catch (err) {
      console.error('[Profile] Error saving profile:', err)
      console.error('[Profile] Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      })
      
      // Extract error message from response if available
      let errorMessage = err.message || 'Failed to update profile'
      if (errorMessage.includes('<!doctype html>')) {
        errorMessage = 'Server error occurred. Please check backend logs for details.'
      }
      
      setError(errorMessage)
    }
  }

  if (loading) {
    return (
      <main className="section">
        <div className="container">
          <p>Đang tải...</p>
        </div>
      </main>
    )
  }

  const displayUser = profile || user
  const avatarUrl = displayUser?.avatarUrl || ''

  return (
    <main className="section">
      <div className="container" style={{ maxWidth: 700 }}>
        <h1 style={{ marginBottom: 24 }}>My Profile</h1>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#c33'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#efe',
            border: '1px solid #cfc',
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: '#3c3'
          }}>
            {success}
          </div>
        )}

        {/* Thẻ thông tin tài khoản */}
        <div style={{
          background: 'var(--bg, #fff)',
          border: '1px solid var(--border, #eee)',
          borderRadius: 8,
          padding: 24
        }}>
          {!editing ? (
            <>
              {/* Avatar Display */}
              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--border, #eee)'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div
                  style={{
                    display: avatarUrl ? 'none' : 'flex',
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'var(--bg-secondary, #f5f5f5)',
                    border: '3px solid var(--border, #eee)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    color: 'var(--muted, #999)',
                    margin: '0 auto'
                  }}
                >
                  {(displayUser?.fullName || displayUser?.email || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Full Name
                  </label>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {displayUser?.fullName || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Username
                  </label>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {displayUser?.username || displayUser?.email || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Email
                  </label>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {displayUser?.email || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Phone
                  </label>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {displayUser?.phone || 'N/A'}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                  Address
                </label>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {displayUser?.addressText || 'N/A'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Role
                  </label>
                  <div style={{ fontSize: 16, fontWeight: 500, textTransform: 'capitalize' }}>
                    {displayUser?.role || 'N/A'}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    User ID
                  </label>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {displayUser?.id || 'N/A'}
                  </div>
                </div>
              </div>

              <button
                className="btn-primary"
                onClick={startEdit}
                style={{ marginTop: 16 }}
              >
                Edit Profile
              </button>
            </>
          ) : (
            <form onSubmit={saveProfile}>
              {/* Avatar URL */}
              <div style={{ marginBottom: 20, textAlign: 'center' }}>
                <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 8 }}>
                  Avatar URL
                </label>
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Avatar preview"
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--border, #eee)',
                      marginBottom: 8
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'var(--bg-secondary, #f5f5f5)',
                      border: '2px solid var(--border, #eee)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                      color: 'var(--muted, #999)',
                      margin: '0 auto 8px'
                    }}
                  >
                    {formData.fullName.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <input
                  type="url"
                  value={formData.avatarUrl}
                  onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  className="input"
                  style={{ width: '100%', maxWidth: 400, margin: '0 auto', display: 'block' }}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    className="input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input"
                  style={{ width: '100%', background: '#f5f5f5' }}
                />
                <small style={{ color: 'var(--muted, #666)', fontSize: 12 }}>
                  Email cannot be changed
                </small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    style={{ width: '100%' }}
                    placeholder="0123456789"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={displayUser?.role || ''}
                    disabled
                    className="input"
                    style={{ width: '100%', background: '#f5f5f5', textTransform: 'capitalize' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                  Address
                </label>
                <textarea
                  value={formData.addressText}
                  onChange={(e) => setFormData({ ...formData, addressText: e.target.value })}
                  className="input"
                  style={{ width: '100%', minHeight: 80, resize: 'vertical' }}
                  placeholder="Enter your full address"
                />
              </div>

              <div style={{
                borderTop: '1px solid var(--border, #eee)',
                paddingTop: 20,
                marginTop: 20,
                marginBottom: 20
              }}>
                <h3 style={{ fontSize: 16, marginBottom: 16 }}>Change Password (Optional)</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                      New Password
                    </label>
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="Leave empty if not changing"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, color: 'var(--muted, #666)', display: 'block', marginBottom: 4 }}>
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="input"
                      style={{ width: '100%' }}
                      placeholder="Leave empty if not changing"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* LỊCH SỬ ĐƠN HÀNG */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 16 }}>Lịch sử đơn hàng</h2>

          {orderError && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              padding: 10,
              borderRadius: 8,
              marginBottom: 16
            }}>
              {orderError}
            </div>
          )}

          {loadingOrders && <p>Đang tải đơn hàng...</p>}

          {!loadingOrders && orders.length === 0 && (
            <p>Bạn chưa có đơn hàng nào.</p>
          )}

          {orders.map(order => {
            const open = openOrderId === order.id
            return (
              <div
                key={order.id}
                style={{
                  marginBottom: 16,
                  padding: 16,
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  background: '#fff'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div><strong>Mã đơn:</strong> {order.orderNumber || order.id}</div>
                    <div>
                      <strong>Ngày:</strong>{' '}
                      {order.createdAt && new Date(order.createdAt).toLocaleString('vi-VN')}
                    </div>
                    <div>
                      <strong>Tổng tiền:</strong>{' '}
                      {Number(order.total || 0).toLocaleString('vi-VN')}₫
                    </div>
                    <div>
                      <strong>Trạng thái:</strong> {order.status || 'Đang xử lý'}
                    </div>
                    {order.status === 'SHIPPING' && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn-primary"
                          type="button"
                          onClick={() => markDelivered(order.id)}
                          style={{ padding: '6px 12px', fontSize: 14 }}
                        >
                          Đã nhận hàng
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn-ghost"
                    type="button"
                    onClick={() => setOpenOrderId(open ? null : order.id)}
                  >
                    {open ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </button>
                </div>

                {open && order.items && (
                  <div
                    style={{
                      marginTop: 12,
                      borderTop: '1px solid #eee',
                      paddingTop: 10
                    }}
                  >
                    {order.items.map((i, idx) => (
                      <div
                        key={i.id || idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 6
                        }}
                      >
                        <span>{i.qty} × {i.name}</span>
                        <strong>
                          {((i.price || 0) * (i.qty || 0)).toLocaleString('vi-VN')}₫
                        </strong>
                      </div>
                    ))}

                    {order.status === 'DELIVERED' && order.paymentStatus === 'PAID' && (
                      <div style={{ marginTop: 8 }}>
                        {order.items.map((i, idx) => (
                          <div key={`review-${i.id || idx}`} style={{ marginTop: 8 }}>
                            <button
                              className="btn-ghost"
                              type="button"
                              onClick={() => {
                                setReviewTarget({ orderId: order.id, productId: i.id })
                                setReviewForm({ rating: 5, title: '', body: '' })
                              }}
                            >
                              Viết đánh giá cho {i.name}
                            </button>
                            {reviewTarget?.orderId === order.id && reviewTarget?.productId === i.id && (
                              <div style={{ marginTop: 8, padding: 12, border: '1px solid #eee', borderRadius: 8 }}>
                                <div style={{ marginBottom: 8 }}>
                                  <label style={{ display: 'block', marginBottom: 4 }}>Đánh giá (1-5 sao)</label>
                                  <select
                                    value={reviewForm.rating}
                                    onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                                    className="input"
                                    style={{ width: 180 }}
                                  >
                                    <option value={5}>5 sao - Tuyệt vời</option>
                                    <option value={4}>4 sao - Tốt</option>
                                    <option value={3}>3 sao - Bình thường</option>
                                    <option value={2}>2 sao - Không tốt</option>
                                    <option value={1}>1 sao - Rất tệ</option>
                                  </select>
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <label style={{ display: 'block', marginBottom: 4 }}>Tiêu đề</label>
                                  <input
                                    className="input"
                                    value={reviewForm.title}
                                    onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                                    placeholder="Tóm tắt đánh giá"
                                  />
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                  <label style={{ display: 'block', marginBottom: 4 }}>Nội dung đánh giá</label>
                                  <textarea
                                    className="input"
                                    style={{ minHeight: 80 }}
                                    value={reviewForm.body}
                                    onChange={(e) => setReviewForm({ ...reviewForm, body: e.target.value })}
                                    placeholder="Chia sẻ trải nghiệm của bạn"
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button
                                    className="btn-primary"
                                    type="button"
                                    disabled={reviewLoading}
                                    onClick={() => submitReview(i.id)}
                                  >
                                    {reviewLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                                  </button>
                                  <button
                                    className="btn-ghost"
                                    type="button"
                                    onClick={() => setReviewTarget(null)}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <hr style={{ margin: '12px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tạm tính</span>
                      <strong>
                        {Number(order.subtotal || 0).toLocaleString('vi-VN')}₫
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Phí ship</span>
                      <strong>
                        {Number(order.shipping || order.shippingFee || 0).toLocaleString('vi-VN')}₫
                      </strong>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 8,
                        fontSize: 16
                      }}
                    >
                      <strong>Tổng cộng</strong>
                      <strong>
                        {Number(order.total || 0).toLocaleString('vi-VN')}₫
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
