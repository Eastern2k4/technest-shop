import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api.js'

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    ordersToPick: 0,
    ordersToPack: 0,
    lowStockItems: 0,
    pendingReplies: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      setLoading(true)
      setError('')
      // Load orders to count pending/packing
      const orders = await api('/api/orders')
      const ordersList = Array.isArray(orders) ? orders : []
      
      // Count orders by status
      const ordersToPick = ordersList.filter(o => o.status === 'PENDING').length
      const ordersToPack = ordersList.filter(o => o.status === 'SHIPPING').length
      
      // Load products to check low stock
      const products = await api('/api/products?size=1000')
      const productList = Array.isArray(products) ? products : (products?.content || [])
      
      // Count low stock items (quantity < 10)
      const lowStock = productList.filter(p => (p.quantity || 0) < 10).length

      const pendingRes = await api('/api/reviews/pending-count')

      setStats({
        ordersToPick,
        ordersToPack,
        lowStockItems: lowStock,
        pendingReplies: Number(pendingRes?.pendingReplies || 0)
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      setError(err?.message || 'Không thể tải dữ liệu.')
    } finally {
      setLoading(false)
    }
  }

  const cards = [
    {
      tone: 'blue',
      title: 'Đơn hàng cần lấy',
      value: stats.ordersToPick,
      icon: '📋',
      to: '/staff/orders',
    },
    {
      tone: 'purple',
      title: 'Đơn hàng đang giao',
      value: stats.ordersToPack,
      icon: '📦',
      to: '/staff/orders',
    },
    {
      tone: 'orange',
      title: 'Sản phẩm sắp hết',
      value: stats.lowStockItems,
      icon: '⚠️',
      to: '/staff/inventory',
    }
    ,
    {
      tone: 'green',
      title: 'Đánh giá cần phản hồi',
      value: stats.pendingReplies,
      icon: '💬',
      to: '/staff/reviews',
    }
  ]

  return (
    <>
      {loading ? (
        <div className="admin-loading">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="admin-error">Lỗi: {error}</div>
      ) : (
        <div className="admin-dashboard">
          <div className="admin-page-head">
            <div>
              <div className="admin-page-kicker">Staff</div>
              <h1 className="admin-page-title">Staff Dashboard</h1>
            </div>

            <button onClick={loadStats} className="btn btn--primary">
              Làm mới
            </button>
          </div>

          <div className="stats-grid">
            {cards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function StatCard({ tone = 'blue', title, value, icon, to }) {
  const content = (
    <div className="stat-card__top">
      <div className="stat-card__meta">
        <div className="stat-card__title">{title}</div>
        <div className="stat-card__value">{value}</div>
      </div>

      <div className="stat-card__icon" aria-hidden="true">
        {icon}
      </div>
    </div>
  )

  if (to) {
    return (
      <Link to={to} className={`stat-card stat-card--${tone} stat-card--clickable`}>
        {content}
      </Link>
    )
  }

  return <div className={`stat-card stat-card--${tone}`}>{content}</div>
}
