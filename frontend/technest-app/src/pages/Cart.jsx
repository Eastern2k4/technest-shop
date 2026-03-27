import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import FieldError from '../components/FieldError.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { OrdersAPI, ProductsAPI, getErrorMessage, getValidationErrors } from '../lib/api.js'

const emptyCheckoutForm = {
  name: '',
  phone: '',
  address: '',
  city: '',
  district: '',
}

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
  const [fieldErrors, setFieldErrors] = useState({})
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        const data = await ProductsAPI.list({ cat: 'all' })
        const productList = Array.isArray(data) ? data : []
        setProducts(productList)
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return
    }

    setCheckoutForm((current) => ({
      name: current.name || user.fullName || '',
      phone: current.phone || user.phone || '',
      address: current.address || user.addressText || '',
      city: current.city,
      district: current.district,
    }))
  }, [isAuthenticated, user])

  useEffect(() => {
    if (isAuthenticated && user && !(user?.accessToken || user?.token)) {
      setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
    }
  }, [isAuthenticated, user])

  const find = (id) => {
    const product = products.find((item) => String(item.id) === String(id))
    if (product) {
      return {
        ...product,
        price: Number(product.price) || 0,
        imageUrl: product.imageUrl || '',
        name: product.name || String(id),
        descriptionShort: product.descriptionShort || '',
      }
    }
    return { price: 0, name: String(id), imageUrl: '', descriptionShort: '' }
  }

  const subtotal = entries.reduce((sum, [id, qty]) => sum + find(id).price * Number(qty), 0)
  const shipping = entries.length ? 30000 : 0
  const total = subtotal + shipping

  function updateField(field, value) {
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }))

    setFieldErrors((current) => ({
      ...current,
      [field]: '',
      ...(field === 'name' || field === 'phone' || field === 'address' || field === 'city' || field === 'district'
        ? { address: '' }
        : {}),
      ...(field === 'payment' ? { payment: '' } : {}),
    }))
    setError('')
  }

  function validateCheckoutForm() {
    const nextErrors = {}

    if (!entries.length) {
      nextErrors.items = 'Giỏ hàng trống.'
    }
    if (!checkoutForm.name.trim()) {
      nextErrors.name = 'Vui lòng nhập họ và tên.'
    }
    if (!checkoutForm.phone.trim()) {
      nextErrors.phone = 'Vui lòng nhập số điện thoại.'
    }
    if (!checkoutForm.address.trim()) {
      nextErrors.address = 'Vui lòng nhập địa chỉ.'
    }
    if (!checkoutForm.city.trim()) {
      nextErrors.city = 'Vui lòng nhập tỉnh/thành.'
    }
    if (!checkoutForm.district.trim()) {
      nextErrors.district = 'Vui lòng nhập quận/huyện.'
    }

    return nextErrors
  }

  async function placeOrder(event) {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    if (!isAuthenticated || !user) {
      navigate(`/signin?returnTo=${encodeURIComponent('/cart')}`)
      return
    }

    const localErrors = validateCheckoutForm()
    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    const token = user?.accessToken || user?.token
    if (!token) {
      setError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.')
      setTimeout(() => {
        navigate(`/signin?returnTo=${encodeURIComponent('/cart')}`)
      }, 1500)
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        items: entries.map(([id, qty]) => ({
          id: Number(id),
          qty: Number(qty),
        })),
        address: [
          checkoutForm.name.trim(),
          checkoutForm.phone.trim(),
          checkoutForm.address.trim(),
          checkoutForm.city.trim(),
          checkoutForm.district.trim(),
        ],
        payment,
      }

      const orderData = await OrdersAPI.create(payload)

      if (!orderData.id) {
        throw new Error('Invalid order response: missing order ID')
      }

      clear()
      navigate(`/order-success/${orderData.id}`)
    } catch (err) {
      const validationErrors = getValidationErrors(err)
      const mappedErrors = mapOrderFieldErrors(validationErrors)

      if (Object.keys(mappedErrors).length > 0) {
        setFieldErrors(mappedErrors)
      }

      const message = getErrorMessage(err, 'Đặt hàng thất bại. Vui lòng thử lại.')
      setError(message)

      if (/đăng nhập/i.test(message) || /Authentication/i.test(message) || err?.status === 401) {
        setTimeout(() => {
          navigate(`/signin?returnTo=${encodeURIComponent('/cart')}`)
        }, 1500)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="section">
      <div className="container cart-layout">
        <section className="cart-items">
          <h1>Giỏ hàng</h1>
          <div className="cart-list">
            {entries.length === 0 && <p className="muted">Giỏ hàng trống.</p>}
            {entries.map(([id, qty]) => {
              const product = find(id)
              return (
                <div className="cart-row" key={id}>
                  <Link to={`/product/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <img src={product.imageUrl || ''} alt={product.name} />
                  </Link>
                  <Link to={`/product/${id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <div>
                      <div className="title">{product.name}</div>
                      {product.descriptionShort && <div className="muted">{product.descriptionShort}</div>}
                    </div>
                  </Link>
                  <div className="price">{Number(product.price).toLocaleString('vi-VN')}₫</div>
                  <div className="qty-control">
                    <button onClick={() => set(id, Math.max(1, Number(qty) - 1))}>-</button>
                    <input
                      type="number"
                      value={qty}
                      min={1}
                      onChange={(event) => set(id, Math.max(1, Number(event.target.value) || 1))}
                    />
                    <button onClick={() => set(id, Number(qty) + 1)}>+</button>
                  </div>
                  <button className="remove" onClick={() => remove(id)}>✕</button>
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
              <div>
                <input
                  name="name"
                  type="text"
                  placeholder="Họ và tên"
                  value={checkoutForm.name}
                  onChange={(event) => updateField('name', event.target.value)}
                />
                <FieldError message={fieldErrors.name} style={fieldErrorStyle} />
              </div>

              <div>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Số điện thoại"
                  value={checkoutForm.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
                <FieldError message={fieldErrors.phone} style={fieldErrorStyle} />
              </div>

              <div>
                <input
                  name="address"
                  type="text"
                  placeholder="Địa chỉ"
                  value={checkoutForm.address}
                  onChange={(event) => updateField('address', event.target.value)}
                />
                <FieldError message={fieldErrors.address} style={fieldErrorStyle} />
              </div>

              <div className="form-row">
                <div>
                  <input
                    name="city"
                    type="text"
                    placeholder="Tỉnh/Thành"
                    value={checkoutForm.city}
                    onChange={(event) => updateField('city', event.target.value)}
                  />
                  <FieldError message={fieldErrors.city} style={fieldErrorStyle} />
                </div>

                <div>
                  <input
                    name="district"
                    type="text"
                    placeholder="Quận/Huyện"
                    value={checkoutForm.district}
                    onChange={(event) => updateField('district', event.target.value)}
                  />
                  <FieldError message={fieldErrors.district} style={fieldErrorStyle} />
                </div>
              </div>

              <h3>Phương thức thanh toán</h3>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={payment === 'cod'}
                  onChange={(event) => {
                    setPayment(event.target.value)
                    updateField('payment', event.target.value)
                  }}
                />
                {' '}
                Thanh toán khi nhận hàng (COD)
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="bank"
                  checked={payment === 'bank'}
                  onChange={(event) => {
                    setPayment(event.target.value)
                    updateField('payment', event.target.value)
                  }}
                />
                {' '}
                Chuyển khoản ngân hàng
              </label>
              <label>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={payment === 'card'}
                  onChange={(event) => {
                    setPayment(event.target.value)
                    updateField('payment', event.target.value)
                  }}
                />
                {' '}
                Thẻ tín dụng/ghi nợ
              </label>
              <FieldError message={fieldErrors.payment} style={fieldErrorStyle} />

              {(payment === 'bank' || payment === 'card') && (
                <div style={paymentHintStyle}>
                  <strong>Lưu ý:</strong> Với {payment === 'bank' ? 'chuyển khoản ngân hàng' : 'thẻ tín dụng/ghi nợ'}, bạn sẽ nhận được thông tin thanh toán sau khi đặt hàng thành công.
                </div>
              )}

              <FieldError message={fieldErrors.items} style={fieldErrorStyle} />

              {error && <div style={submitErrorStyle}>{error}</div>}

              <button className="btn-primary full" type="submit" disabled={submitting || !isAuthenticated || loading}>
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

function mapOrderFieldErrors(validationErrors) {
  if (!validationErrors || typeof validationErrors !== 'object') {
    return {}
  }

  const nextErrors = {}
  const addressKeys = [
    ['name', ['address[0]', 'address.0', 'address[0].<list element>', 'address']],
    ['phone', ['address[1]', 'address.1', 'address[1].<list element>']],
    ['address', ['address[2]', 'address.2', 'address[2].<list element>']],
    ['city', ['address[3]', 'address.3', 'address[3].<list element>']],
    ['district', ['address[4]', 'address.4', 'address[4].<list element>']],
  ]

  addressKeys.forEach(([field, candidates]) => {
    const matchedKey = candidates.find((key) => validationErrors[key])
    if (matchedKey) {
      nextErrors[field] = validationErrors[matchedKey]
    }
  })

  if (validationErrors.items) {
    nextErrors.items = validationErrors.items
  }
  if (validationErrors.payment) {
    nextErrors.payment = validationErrors.payment
  }

  return nextErrors
}

const fieldErrorStyle = {
  color: 'red',
  marginTop: 4,
  fontSize: 12,
  display: 'block',
}

const submitErrorStyle = {
  color: 'red',
  marginTop: 8,
  fontSize: 14,
}

const paymentHintStyle = {
  marginTop: 12,
  padding: 12,
  backgroundColor: '#f0f9ff',
  border: '1px solid #bae6fd',
  borderRadius: 4,
  fontSize: 14,
}
