import { NavLink, Outlet } from "react-router-dom";
import "../styles/admin.css";

const items = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/revenue", label: "Revenue" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/users", label: "Users" },
  { to: "/profile", label: "Profile" },
];

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">TN</div>
          <div>
            <div className="admin-title">TechNest</div>
            <div className="admin-subtitle">Admin Panel</div>
          </div>
        </div>

        <nav className="admin-nav">
          {items.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              end={it.end}
              className={({ isActive }) =>
                `admin-link ${isActive ? "is-active" : ""}`
              }
            >
              <span className="admin-dot" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="admin-footer">
          <div className="admin-hint">Tip</div>
          <div className="admin-hint-text">
            Use the sidebar to manage orders, products and users.
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">Admin</div>
          <div className="admin-topbar-actions">
            {/* chừa chỗ để sau này bạn gắn nút refresh / export / search */}
          </div>
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
