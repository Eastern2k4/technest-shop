import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../lib/api.js'

export default function Cart() {
  const { items, set, remove, clear } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const entries = useMemo(() => Object.entries(items), [items])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [payment, setPayment] = useState('cod')
  
  // Clear error when user changes or payment method changes
  useEffect(() => {
    setError('')
  }, [user, payment])
  
  // Verify authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = user?.accessToken || user?.token
      if (!token) {
        setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
      }
    }
  }, [isAuthenticated, user])
  
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const data = await api('/api/products?cat=all')
        const productList = Array.isArray(data) ? data : (data.content || [])
        setProducts(productList)
      } catch (err) {
        console.error('Error fetching products:', err)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])
  
  // Find product by ID, handling both string and number ID types
  const find = id => {
    const product = products.find(p => String(p.id) === String(id))
    if (product) {
      return {
        ...product,
        price: Number(product.price) || 0,
        imageUrl: product.imageUrl || '',
        name: product.name || String(id),
        descriptionShort: product.descriptionShort || ''
      }
    }
    return { price: 0, name: String(id), imageUrl: '', descriptionShort: '' }
  }
  
  const subtotal = entries.reduce((s, [id, qty]) => s + find(id).price * Number(qty), 0)
  const shipping = entries.length ? 30000 : 0
  const total = subtotal + shipping

  async function placeOrder(e) {
    e.preventDefault()
    setError('')
    
    if (!entries.length) {
      setError('Giỏ hàng trống')
      return
    }

    // Check authentication
    if (!isAuthenticated || !user) {
      // Store current URL to return after login
      const returnUrl = '/cart'
      navigate(`/signin?returnTo=${encodeURIComponent(returnUrl)}`)
      return
    }

    setSubmitting(true)

    try {
      const fd = new FormData(e.currentTarget)
      const address = [
        fd.get('name')?.toString().trim() || '',
        fd.get('phone')?.toString().trim() || '',
        fd.get('address')?.toString().trim() || '',
        fd.get('city')?.toString().trim() || '',
        fd.get('district')?.toString().trim() || ''
      ]
      
      // Validate address fields
      if (address.some(a => !a)) {
        setError('Vui lòng điền đầy đủ thông tin địa chỉ')
        setSubmitting(false)
        return
      }

      const selectedPayment = payment || fd.get('payment') || 'cod'
      const payload = { 
        items: entries.map(([id, qty]) => ({ 
          id: Number(id), 
          qty: Number(qty) 
        })), 
        address, 
        payment: selectedPayment
      }

      // Debug: Check token before making request
      const token = user?.accessToken || user?.token
      console.log('[Cart] Placing order with user:', user?.email, 'hasToken:', !!token, 'tokenLength:', token?.length)
      if (!token) {
        setError('No authentication token found. Please log in again.')
        setSubmitting(false)
        setTimeout(() => {
          navigate(`/signin?returnTo=${encodeURIComponent('/cart')}`)
        }, 1500)
        return
      }

      console.log('[Cart] Order payload:', payload)
      
      try {
        const orderData = await api('/api/orders', {
          method: 'POST',
          body: payload
        })
        
        console.log('[Cart] Order created successfully:', orderData)
      
        if (!orderData.id) {
          throw new Error('Invalid order response: missing order ID')
        }

        clear()
        navigate(`/order-success/${orderData.id}`)
      } catch (apiErr) {
        console.error('[Cart] API error:', apiErr)
        throw apiErr
      }
    } catch (err) {
      console.error('[Cart] Error placing order:', err)
      console.error('[Cart] Error details:', {
        message: err.message,
        stack: err.stack
      })
      
      const message = err.message || 'Đặt hàng thất bại. Vui lòng thử lại.'
      setError(message)
      setSubmitting(false)
      
      if (/đăng nhập/i.test(message) || /Authentication/i.test(message) || /401/i.test(message)) {
        setTimeout(() => {
          navigate(`/signin?returnTo=${encodeURIComponent('/cart')}`)
        }, 1500)
      }
    }
  }

  return (
    <main className="section">
      <div className="container cart-layout">
        <section className="cart-items">
          <h1>Giỏ hàng</h1>
          <div className="cart-list">
            {entries.length===0 && <p className="muted">Giỏ hàng trống.</p>}
            {entries.map(([id, qty])=>{
              const p = find(id)
              return (
                <div className="cart-row" key={id}>
                  <Link to={`/product/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={p.imageUrl || ''} alt={p.name} />
                  </Link>
                  <Link to={`/product/${id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <div><div className="title">{p.name}</div>{p.descriptionShort && <div className="muted">{p.descriptionShort}</div>}</div>
                  </Link>
                  <div className="price">{Number(p.price).toLocaleString('vi-VN')}₫</div>
                  <div className="qty-control">
                    <button onClick={()=>set(id, Math.max(1, Number(qty)-1))}>-</button>
                    <input type="number" value={qty} min={1} onChange={e=>set(id, Math.max(1, Number(e.target.value)||1))} />
                    <button onClick={()=>set(id, Number(qty)+1)}>+</button>
                  </div>
                  <button className="remove" onClick={()=>remove(id)}>✕</button>
                </div>
              )
            })}
          </div>
        </section>
        <aside className="cart-summary">
          <div className="summary-card">
            <h2>Tóm tắt đơn hàng</h2>
            <div className="summary-row"><span>Tạm tính</span><strong>{subtotal.toLocaleString('vi-VN')}₫</strong></div>
            <div className="summary-row"><span>Phí vận chuyển</span><strong>{shipping.toLocaleString('vi-VN')}₫</strong></div>
            <div className="summary-row total"><span>Tổng cộng</span><strong>{total.toLocaleString('vi-VN')}₫</strong></div>
          </div>
          <div className="checkout-card">
            <h3>Địa chỉ giao hàng</h3>
            <form onSubmit={placeOrder} className="address-form">
              <input name="name" type="text" placeholder="Họ và tên" required />
              <input name="phone" type="tel" placeholder="Số điện thoại" required />
              <input name="address" type="text" placeholder="Địa chỉ" required />
              <div className="form-row">
                <input name="city" type="text" placeholder="Tỉnh/Thành" required />
                <input name="district" type="text" placeholder="Quận/Huyện" required />
              </div>
              <h3>Phương thức thanh toán</h3>
              <label><input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={(e) => setPayment(e.target.value)} /> Thanh toán khi nhận hàng (COD)</label>
              <label><input type="radio" name="payment" value="bank" checked={payment === 'bank'} onChange={(e) => setPayment(e.target.value)} /> Chuyển khoản ngân hàng</label>
              <label><input type="radio" name="payment" value="card" checked={payment === 'card'} onChange={(e) => setPayment(e.target.value)} /> Thẻ tín dụng/ghi nợ</label>
              {(payment === 'bank' || payment === 'card') && (
                <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '4px', fontSize: '14px' }}>
                  <strong>Lưu ý:</strong> Với {payment === 'bank' ? 'chuyển khoản ngân hàng' : 'thẻ tín dụng/ghi nợ'}, bạn sẽ nhận được thông tin thanh toán sau khi đặt hàng thành công.
                </div>
              )}
              {error && <div style={{ color: 'red', marginTop: '8px', fontSize: '14px' }}>{error}</div>}
              <button className="btn-primary full" type="submit" disabled={submitting || !isAuthenticated}>
                {submitting ? 'Đang xử lý...' : isAuthenticated ? 'Đặt hàng' : 'Vui lòng đăng nhập'}
              </button>
              {!isAuthenticated && (
                <div style={{ marginTop: '12px', textAlign: 'center' }}>
                  <Link to="/signin" style={{ color: '#0066cc', textDecoration: 'underline' }}>
                    Đăng nhập để đặt hàng
                  </Link>
                </div>
              )}
            </form>
          </div>
        </aside>
      </div>
    </main>
  )
}
