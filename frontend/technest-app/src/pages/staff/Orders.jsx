import { useEffect, useState } from 'react'
import { OrdersAPI, getErrorMessage } from '../../lib/api.js'

export default function StaffOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState('')
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      setLoading(true)
      setError(null)

      const data = await OrdersAPI.list()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading orders:', err)
      setError(getErrorMessage(err, 'Failed to load orders'))
    } finally {
      setLoading(false)
    }
  }
  

  async function updateOrderStatus(orderId, status) {
    try {
      setUpdatingOrderId(orderId)
      setError(null)
      setNotice('')
      await OrdersAPI.updateStatus(orderId, { status })
      setNotice('Order status updated successfully.')
      await loadOrders()
    } catch (err) {
      console.error('Error updating order:', err)
      setNotice('')
      setError(getErrorMessage(err, 'Failed to update order'))
    } finally {
      setUpdatingOrderId(null)
    }
  }

  async function updatePaymentStatus(orderId, paymentStatus) {
    try {
      setUpdatingOrderId(orderId)
      setError(null)
      setNotice('')
      await OrdersAPI.updateStatus(orderId, { paymentStatus })
      setNotice('Payment status updated successfully.')
      await loadOrders()
    } catch (err) {
      console.error('Error updating payment status:', err)
      setNotice('')
      setError(getErrorMessage(err, 'Failed to update payment status'))
    } finally {
      setUpdatingOrderId(null)
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
      ) : (
        <>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>}
        {orders.length === 0 ? (
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
          {notice && <div style={{ color: '#047857', marginBottom: 12 }}>{notice}</div>}
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
                      disabled={updatingOrderId === order.id}
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
                          disabled={updatingOrderId === order.id}
                          style={{ padding: '4px 12px', fontSize: 14 }}
                        >
                          {updatingOrderId === order.id ? 'Updating...' : 'Start Shipping'}
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
        </>
      )}
    </div>
  )
}
