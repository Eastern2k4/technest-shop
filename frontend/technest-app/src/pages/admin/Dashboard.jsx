// src/pages/admin/Dashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("vi-VN") + "₫";
}

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function normalizeStatus(s) {
  return String(s || "").toUpperCase();
}

function StatusBadge({ value, type = "status" }) {
  const v = normalizeStatus(value);

  let cls = "badge";
  if (type === "payment") {
    if (v === "PAID") cls += " badge--paid";
    else if (v === "UNPAID") cls += " badge--unpaid";
    else cls += " badge--neutral";
  } else {
    if (v === "PENDING") cls += " badge--pending";
    else if (v === "SHIPPING") cls += " badge--shipping";
    else if (v === "COMPLETED" || v === "DONE") cls += " badge--success";
    else if (v === "CANCELLED" || v === "CANCELED") cls += " badge--danger";
    else cls += " badge--neutral";
  }

  return <span className={cls}>{v || "-"}</span>;
}

function StatCard({ tone = "green", title, value, icon, to }) {
  const content = (
    <>
      <div className="stat-card__top">
        <div className="stat-card__meta">
          <div className="stat-card__title">{title}</div>
          <div className="stat-card__value">{value}</div>
        </div>

        <div className="stat-card__icon" aria-hidden="true">
          {icon}
        </div>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`stat-card stat-card--${tone} stat-card--clickable`}>
        {content}
      </Link>
    );
  }

  return <div className={`stat-card stat-card--${tone}`}>{content}</div>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    users: 0,
    products: 0,
    deliveredRate: 0,
    avgOrderValue: 0,
    cancelRate: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // CHỈ load khi chắc chắn đã có token trong localStorage
    const interval = setInterval(() => {
      try {
        const u = JSON.parse(localStorage.getItem("tn_user") || "null");
        const token = u?.accessToken || u?.token || null;
        if (token) {
          clearInterval(interval);
          loadData();
        }
      } catch {
        // nếu JSON parse fail thì cứ chờ tiếp
      }
    }, 200);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [statsData, ordersData] = await Promise.all([
        api("/api/admin/statistics"),
        api("/api/orders"),
      ]);

      setStats({
        revenue: Number(statsData.totalRevenue || 0),
        orders: Number(statsData.totalOrders || 0),
        users: Number(statsData.totalUsers || 0),
        products: Number(statsData.totalProducts || 0),
        deliveredRate: Number(statsData.deliveredRate || 0),
        avgOrderValue: Number(statsData.avgOrderValue || 0),
        cancelRate: Number(statsData.cancelRate || 0),
      });

      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      const sorted = [...ordersArray].sort((a, b) => {
        if (a.placedAt && b.placedAt) return new Date(b.placedAt) - new Date(a.placedAt);
        return (b.id || 0) - (a.id || 0);
      });

      setRecentOrders(sorted.slice(0, 5));
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  const cards = useMemo(
    () => [
      {
        tone: "green",
        title: "Doanh thu",
        value: formatCurrency(stats.revenue),
        icon: "💰",
        to: "/admin/revenue",
      },
      {
        tone: "blue",
        title: "Đơn hàng",
        value: stats.orders,
        icon: "📦",
        to: "/admin/orders",
      },
      {
        tone: "purple",
        title: "Người dùng",
        value: stats.users,
        icon: "👥",
        to: "/admin/users",
      },
      {
        tone: "orange",
        title: "Sản phẩm",
        value: stats.products,
        icon: "🛍️",
        to: "/admin/products",
      },
    ],
    [stats]
  );

  const kpiCards = useMemo(
    () => [
      {
        tone: "green",
        title: "Tỷ lệ giao thành công",
        value: formatPercent(stats.deliveredRate),
        icon: "✅",
      },
      {
        tone: "blue",
        title: "AOV (giá trị đơn TB)",
        value: formatCurrency(stats.avgOrderValue),
        icon: "📊",
      },
      {
        tone: "orange",
        title: "Tỷ lệ hủy (thanh toán lỗi)",
        value: formatPercent(stats.cancelRate),
        icon: "⚠️",
      },
    ],
    [stats]
  );

  if (loading) return <div className="admin-loading">Đang tải...</div>;
  if (error) return <div className="admin-error">Lỗi: {error}</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-page-head">
        <div>
          <div className="admin-page-kicker">Admin</div>
          <h1 className="admin-page-title">Admin Dashboard</h1>
        </div>

        <button onClick={loadData} className="btn btn--primary">
          Làm mới
        </button>
      </div>

      <div className="stats-grid">
        {cards.map((c) => (
          <StatCard key={c.title} {...c} />
        ))}
      </div>

      <div className="stats-grid" style={{ marginTop: 16 }}>
        {kpiCards.map((c) => (
          <StatCard key={c.title} {...c} />
        ))}
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2 className="panel__title">Đơn hàng gần đây</h2>
          <div className="panel__meta">{recentOrders.length} đơn</div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty">
            <div className="empty__icon">📭</div>
            <div className="empty__title">Chưa có đơn hàng nào</div>
            <div className="empty__desc">Khi có đơn mới, danh sách sẽ hiển thị ở đây.</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th className="t-right">Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="mono">#{o.orderNumber || o.id}</td>
                    <td>{o.customerName || o.customerEmail || "-"}</td>
                    <td className="t-right t-strong">{formatCurrency(o.total)}</td>
                    <td>
                      <StatusBadge value={o.status} />
                    </td>
                    <td>
                      <StatusBadge value={o.paymentStatus} type="payment" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="panel__footer">
              <Link to="/admin/orders" className="link">
                Xem tất cả đơn hàng <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
