import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { OrdersAPI, ProductsAPI, ReviewsAPI, getErrorMessage } from '../../lib/api.js'

export default function StaffDashboard() {
  const [stats, setStats] = useState({
    ordersToPick: 0,
    ordersToPack: 0,
    lowStockItems: 0,
    pendingReviews: 0
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
      const [orders, products, pendingRes] = await Promise.all([
        OrdersAPI.list(),
        ProductsAPI.list({ cat: 'all' }),
        ReviewsAPI.pendingCount(),
      ])
      const ordersList = Array.isArray(orders) ? orders : []
      const ordersToPick = ordersList.filter(o => o.status === 'PENDING').length
      const ordersToPack = ordersList.filter(o => o.status === 'SHIPPING').length
      const productList = Array.isArray(products) ? products : []
      const lowStock = productList.filter(p => (p.quantity || 0) < 10).length

      setStats({
        ordersToPick,
        ordersToPack,
        lowStockItems: lowStock,
        pendingReviews: Number(pendingRes?.pendingReviews || 0)
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      setError(getErrorMessage(err, 'Không thể tải dữ liệu.'))
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
      title: 'Đánh giá chờ duyệt',
      value: stats.pendingReviews,
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
