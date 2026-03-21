import { Route, Routes } from 'react-router-dom'
import ChatbotWithHistory from './components/ChatbotWithHistory.jsx'
import Footer from './components/Footer.jsx'
import Header from './components/Header.jsx'

import { CartProvider } from './context/CartContext.jsx'
import Cart from './pages/Cart.jsx'
import Category from './pages/Category.jsx'
import Home from './pages/Home.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import Product from './pages/Product.jsx'
import Profile from './pages/Profile.jsx'
import Search from './pages/Search.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import AdminRevenue from './pages/admin/Revenue.jsx'

import { AdminRoute, PrivateRoute, StaffRoute } from './RouteGuard.jsx'

// Admin
import AdminLayout from './layouts/AdminLayout.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import AdminOrders from './pages/admin/Orders.jsx'
import AdminProducts from './pages/admin/Product.jsx'
import AdminUsers from './pages/admin/Users.jsx'

// Staff
import StaffLayout from './layouts/StaffLayout.jsx'
import StaffInventory from './pages/staff/Inventory.jsx'
import StaffOrders from './pages/staff/Orders.jsx'
import StaffReviews from './pages/staff/Reviews.jsx'
import StaffDashboard from './pages/staff/StaffDashboard.jsx'

export default function App() {
  return (
    <CartProvider>
      <Header />
      <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/category/:cat" element={<Category />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/search" element={<Search />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Cần đăng nhập */}
          <Route
            path="/order-success/:id"
            element={
              <PrivateRoute>
                <OrderSuccess />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />

          {/* Admin area (role=ADMIN) */}
          <Route
  path="/admin"
  element={
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  }
>
  {/* /admin */}
  <Route index element={<AdminDashboard />} />

  {/* /admin/revenue */}
  <Route path="revenue" element={<AdminRevenue />} />

  {/* /admin/products */}
  <Route path="products" element={<AdminProducts />} />

  {/* /admin/orders */}
  <Route path="orders" element={<AdminOrders />} />

  {/* /admin/users */}
  <Route path="users" element={<AdminUsers />} />
</Route>


          {/* Staff area (role=STAFF) */}
          <Route
            path="/staff/*"
            element={
              <StaffRoute>
                <StaffLayout />
              </StaffRoute>
            }
          >
            <Route index element={<StaffDashboard />} />
            <Route path="orders" element={<StaffOrders />} />
            <Route path="inventory" element={<StaffInventory />} />
            <Route path="reviews" element={<StaffReviews />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
      <ChatbotWithHistory />
    </CartProvider>
  )
}
