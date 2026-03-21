import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

export default function StaffOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      setError(null)
  
      const data = await api('/api/orders')   // <-- gọi BE
      // data chính là list<Map<String, Object>> backend trả ra ở getAllOrders
  
      // map lại cho khớp với UI StaffOrders đang dùng
      const mapped = data.map(o => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        itemCount: o.itemCount || 0
      }))
  
      setOrders(mapped)
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }
  

  async function updateOrderStatus(orderId, status) {
    try {
      await api(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: { status }  // hoặc gửi thêm paymentStatus nếu cần
      })
      await loadOrders()
    } catch (err) {
      console.error('Error updating order:', err)
      alert('Failed to update order: ' + (err.message || 'Unknown error'))
    }
  }

  async function updatePaymentStatus(orderId, paymentStatus) {
    try {
      await api(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        body: { paymentStatus }
      })
      await loadOrders()
    } catch (err) {
      console.error('Error updating payment status:', err)
      alert('Failed to update payment status: ' + (err.message || 'Unknown error'))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Process Orders</h1>
        <button 
          className="btn-primary" 
          onClick={loadOrders}
          style={{ padding: '8px 16px' }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : orders.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: 48, 
          background: 'var(--bg-secondary, #fafafa)',
          borderRadius: 8,
          border: '1px solid var(--border, #eee)'
        }}>
          <p style={{ fontSize: 16, color: 'var(--muted, #666)', marginBottom: 8 }}>
            No orders to process
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted, #999)' }}>
            Chưa có đơn hàng nào cần xử lý.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table width="100%" cellPadding="12" style={{ 
            borderCollapse: "collapse", 
            border: "1px solid var(--border, #eee)",
            background: 'var(--bg, #fff)'
          }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary, #fafafa)" }}>
                <th align="left">Order ID</th>
                <th align="left">Customer</th>
                <th align="left">Items</th>
                <th align="left">Total</th>
                <th align="left">Status</th>
                <th align="left">Payment</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderTop: '1px solid var(--border, #eee)' }}>
                  <td>{order.orderNumber || `#${order.id}`}</td>
                  <td>{order.customerName || 'N/A'}</td>
                  <td>{order.itemCount || 0} item(s)</td>
                  <td>{Number(order.total || 0).toLocaleString('vi-VN')}₫</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: order.status === 'PENDING' ? '#fff3cd' : 
                                  order.status === 'SHIPPING' ? '#cfe2ff' : '#d1e7dd',
                      color: order.status === 'PENDING' ? '#856404' : 
                             order.status === 'SHIPPING' ? '#084298' : '#0f5132'
                    }}>
                      {order.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <select
                      value={order.paymentStatus || 'UNPAID'}
                      onChange={(e) => updatePaymentStatus(order.id, e.target.value)}
                      style={{ padding: '4px 8px', borderRadius: 4 }}
                    >
                      <option value="UNPAID">UNPAID</option>
                      <option value="PAID">PAID</option>
                      <option value="FAILED">FAILED</option>
                      <option value="REFUNDED">REFUNDED</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {order.status === 'PENDING' && (
                        <button 
                          className="btn-primary" 
                          onClick={() => updateOrderStatus(order.id, 'SHIPPING')}
                          style={{ padding: '4px 12px', fontSize: 14 }}
                        >
                          Start Shipping
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
