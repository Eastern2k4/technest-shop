import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'

export default function OrderSuccess() {
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Chưa đăng nhập
    if (!isAuthenticated) {
      setError('Vui lòng đăng nhập để xem đơn hàng')
      setLoading(false)
      return
    }

    // Không có ID đơn hàng
    if (!id) {
      setError('Mã đơn hàng không hợp lệ')
      setLoading(false)
      return
    }

    api(`/api/orders/${id}`)
      .then(data => setOrder(data))
      .catch(err => {
        console.error('Error fetching order:', err)
        setError(err.message || 'Không thể tải thông tin đơn hàng')
      })
      .finally(() => setLoading(false))
  }, [id, isAuthenticated, user])

  // Loading
  if (loading) {
    return (
      <main className="section">
        <div className="container">Đang tải...</div>
      </main>
    )
  }

  // Lỗi
  if (error || !order) {
    return (
      <main className="section">
        <div className="container">
          <h1>Lỗi</h1>
          <p className="muted">{error || 'Không tìm thấy đơn hàng'}</p>
          <div style={{ marginTop: 12 }}>
            <Link className="btn-primary" to="/">Về trang chủ</Link>
          </div>
        </div>
      </main>
    )
  }

  // Thành công
  return (
    <main className="section">
      <div className="container">
        <h1>Đặt hàng thành công</h1>
        <p className="muted">Mã đơn: {order.orderNumber || order.id}</p>

        {/* Khung tóm tắt đơn hàng */}
        <div className="summary-card" style={{ marginTop: 12 }}>
          {order.items?.map((i, idx) => (
            <div key={i.id || idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span>{i.qty} × {i.name}</span>
              <strong>{(i.price * i.qty).toLocaleString('vi-VN')}₫</strong>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            <span>Tạm tính</span>
            <strong>{Number(order.subtotal).toLocaleString('vi-VN')}₫</strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Phí vận chuyển</span>
            <strong>{Number(order.shipping).toLocaleString('vi-VN')}₫</strong>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            borderTop: '1px solid #e5e7eb', 
            marginTop: 12, 
            paddingTop: 12 
          }}>
            <span>Tổng cộng</span>
            <strong>{Number(order.total).toLocaleString('vi-VN')}₫</strong>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Link className="btn-ghost" to="/">Tiếp tục mua sắm</Link>
          <Link className="btn-primary" to="/category/all">Xem sản phẩm</Link>
        </div>
      </div>
    </main>
  )
}
