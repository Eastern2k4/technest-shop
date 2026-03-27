import { useEffect, useState } from 'react'
import { OrdersAPI, getErrorMessage } from '../../lib/api.js'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [detailsLoadingId, setDetailsLoadingId] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders(nextFilters = {}) {
    try {
      setLoading(true)
      setError('')
      const filters = {
        status: nextFilters.status ?? statusFilter,
        from: nextFilters.from ?? dateFrom,
        to: nextFilters.to ?? dateTo,
        q: nextFilters.q ?? search.trim(),
      }
      const data = await OrdersAPI.list(filters)
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to load orders', err)
      setError(getErrorMessage(err, 'Failed to load orders'))
    } finally {
      setLoading(false)
    }
  }

  // Payment status updates are handled by staff

  async function loadOrderDetails(id) {
    try {
      setDetailsLoadingId(id)
      setError('')
      const order = await OrdersAPI.get(id)
      setSelectedOrder(order)
    } catch (err) {
      console.error('Failed to load order details', err)
      setError(getErrorMessage(err, 'Failed to load order details'))
    } finally {
      setDetailsLoadingId(null)
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: 12 }}>Manage Orders</h1>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 16,
        alignItems: 'end'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Trạng thái</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '6px 8px', width: '100%' }}
          >
            <option value="">Tất cả</option>
            <option value="PENDING">PENDING</option>
            <option value="SHIPPING">SHIPPING</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Từ ngày</label>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            style={{ padding: '6px 8px', width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Đến ngày</label>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            style={{ padding: '6px 8px', width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Khách hàng / Mã đơn</label>
          <input
            type="text"
            placeholder="Email, tên hoặc mã đơn"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '6px 8px', width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={loadOrders}>Lọc</button>
          <button
            className="btn-ghost"
            onClick={() => {
              setStatusFilter('')
              setDateFrom('')
              setDateTo('')
              setSearch('')
              setTimeout(() => loadOrders({ status: '', from: '', to: '', q: '' }), 0)
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <table
        width="100%"
        cellPadding="8"
        style={{ borderCollapse: 'collapse', border: '1px solid #eee' }}
      >
        <thead>
          <tr style={{ background: '#fafafa' }}>
            <th align="left">Order ID</th>
            <th align="left">Customer</th>
            <th align="left">Total</th>
            <th align="left">Status</th>
            <th align="left">Payment Status</th>
            <th align="left">Payment Method</th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>
                No orders found
              </td>
            </tr>
          ) : (
            orders.map(o => (
              <tr key={o.id}>
                <td>#{o.orderNumber || o.id}</td>
                <td>{o.customerName || o.customerEmail}</td>
                <td>{Number(o.total || 0).toLocaleString('vi-VN')}₫</td>
                <td>{o.status}</td>
                <td>{o.paymentStatus}</td>
                <td>{o.paymentMethod?.toUpperCase() || 'COD'}</td>
                <td>
                  <button onClick={() => loadOrderDetails(o.id)} disabled={detailsLoadingId === o.id}>
                    {detailsLoadingId === o.id ? 'Loading...' : 'View Details'}
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  )
}

function OrderDetailsModal({
  order,
  onClose,
}) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'white',
          padding: 24,
          borderRadius: 8,
          width: '90%',
          maxWidth: 700,
          maxHeight: '90vh',
          overflow: 'auto',
        }}
      >
        <h2>Order Details #{order.orderNumber || order.id}</h2>

        <div style={{ marginBottom: 16 }}>
          <h3>Customer Information</h3>
          <p>
            <strong>Email:</strong> {order.customerEmail || 'N/A'}
          </p>
          <p>
            <strong>Name:</strong> {order.customerName || 'N/A'}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3>Order Items</h3>
          <table
            width="100%"
            cellPadding="8"
            style={{ borderCollapse: 'collapse', border: '1px solid #eee' }}
          >
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th align="left">Product</th>
                <th align="left">Quantity</th>
                <th align="left">Price</th>
                <th align="left">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items &&
                order.items.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{item.name}</td>
                    <td>{item.qty}</td>
                    <td>
                      {Number(item.price || 0).toLocaleString('vi-VN')}₫
                    </td>
                    <td>
                      {Number(
                        (item.price || 0) * (item.qty || 0),
                      ).toLocaleString('vi-VN')}
                      ₫
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3>Order Summary</h3>
          <p>
            <strong>Subtotal:</strong>{' '}
            {Number(order.subtotal || 0).toLocaleString('vi-VN')}₫
          </p>
          <p>
            <strong>Shipping:</strong>{' '}
            {Number(order.shipping || 0).toLocaleString('vi-VN')}₫
          </p>
          <p>
            <strong>Total:</strong>{' '}
            {Number(order.total || 0).toLocaleString('vi-VN')}₫
          </p>
          <p>
            <strong>Payment Method:</strong>{' '}
            {order.paymentMethod?.toUpperCase() || 'COD'}
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <h3>Status</h3>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>
              Order Status
            </label>
            <div>{order.status}</div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4 }}>
              Payment Status
            </label>
            <div>{order.paymentStatus}</div>
          </div>
        </div>


        <div
          style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              border: '1px solid #ccc',
              borderRadius: 4,
              background: 'white',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
