import { NavLink, Outlet } from "react-router-dom";
import "../styles/admin.css";

const items = [
  { to: "/staff", label: "Dashboard", end: true },
  { to: "/staff/orders", label: "Process Orders" },
  { to: "/staff/inventory", label: "Inventory" },
  { to: "/staff/reviews", label: "Reviews" },
  { to: "/profile", label: "Profile" },
];

export default function StaffLayout() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">TN</div>
          <div>
            <div className="admin-title">TechNest</div>
            <div className="admin-subtitle">Staff Panel</div>
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
            Process orders, manage inventory, and reply to reviews here.
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">Staff</div>
          <div className="admin-topbar-actions" />
        </div>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
} 
