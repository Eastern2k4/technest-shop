import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { api } from '../lib/api.js'

const COMMON_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Huawei', 'Sony', 'LG', 'Asus', 'Acer', 'Dell', 'HP', 'Lenovo', 'MSI', 'Razer', 'Logitech', 'JBL', 'Bose']

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const query = searchParams.get('q') || ''
  const minPriceParam = searchParams.get('minPrice')
  const maxPriceParam = searchParams.get('maxPrice')
  const brandParam = searchParams.get('brand') || ''
  const categoryParam = searchParams.get('category') || ''
  
  const { add } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Filter states
  const [minPrice, setMinPrice] = useState(minPriceParam || '')
  const [maxPrice, setMaxPrice] = useState(maxPriceParam || '')
  const [brand, setBrand] = useState(brandParam)
  const [category, setCategory] = useState(categoryParam)
  const [showFilters, setShowFilters] = useState(false)

  const buildSearchUrl = (q, min, max, br, cat) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (min) params.set('minPrice', min)
    if (max) params.set('maxPrice', max)
    if (br) params.set('brand', br)
    if (cat) params.set('category', cat)
    return `/search?${params.toString()}`
  }

  const applyFilters = () => {
    const url = buildSearchUrl(query, minPrice, maxPrice, brand, category)
    navigate(url)
  }

  const clearFilters = () => {
    setMinPrice('')
    setMaxPrice('')
    setBrand('')
    setCategory('')
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    // Don't fetch if no query and no filters
    if (!query.trim() && !category && !minPriceParam && !maxPriceParam && !brandParam) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    // Build API URL with all filters
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (category) params.set('cat', category)
    if (minPriceParam) params.set('minPrice', minPriceParam)
    if (maxPriceParam) params.set('maxPrice', maxPriceParam)
    if (brandParam) params.set('brand', brandParam)
    
    api(`/api/products?${params.toString()}`)
      .then(data => {
        const products = Array.isArray(data) ? data : (data.content || [])
        setItems(products)
      })
      .catch(err => {
        console.error('Error fetching products:', err)
        setError(err.message)
        setItems([])
      })
      .finally(() => setLoading(false))
  }, [query, minPriceParam, maxPriceParam, brandParam, category])

  const hasActiveFilters = minPrice || maxPrice || brand || category

  return (
    <main className="section">
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
        {/* Filters Sidebar */}
        <aside className="search-filters">
          <div style={{ position: 'sticky', top: '80px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', margin: 0 }}>Bộ lọc</h2>
              <button 
                className="btn-ghost" 
                onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'none' }}
              >
                {showFilters ? 'Ẩn' : 'Hiện'}
              </button>
            </div>
            
            <div className="filter-section">
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Danh mục</h3>
              <select 
                className="input" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                <option value="">Tất cả</option>
                <option value="phone">Phone</option>
                <option value="laptop">Laptop</option>
                <option value="screen">Screen</option>
                <option value="headphone">Headphone</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div className="filter-section">
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Khoảng giá</h3>
              <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="number"
                  className="input"
                  placeholder="Từ (₫)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Đến (₫)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-section">
              <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Thương hiệu</h3>
              <select 
                className="input" 
                value={brand} 
                onChange={(e) => setBrand(e.target.value)}
                style={{ width: '100%', marginBottom: '16px' }}
              >
                <option value="">Tất cả</option>
                {COMMON_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn-primary" onClick={applyFilters} style={{ flex: 1 }}>
                Áp dụng
              </button>
              {hasActiveFilters && (
                <button className="btn-ghost" onClick={clearFilters}>
                  Xóa
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Results */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ margin: 0, marginBottom: '8px' }}>
                {query ? `Kết quả tìm kiếm: "${query}"` : 'Tìm kiếm sản phẩm'}
              </h1>
              {!loading && (
                <p style={{ color: 'var(--muted)', margin: 0 }}>
                  Tìm thấy {items.length} sản phẩm
                  {hasActiveFilters && ' (đã lọc)'}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <p>Đang tải...</p>
          ) : error ? (
            <div>
              <p style={{ color: 'red' }}>Lỗi: {error}</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: '18px', color: 'var(--muted)', marginBottom: '16px' }}>
                {query 
                  ? `Không tìm thấy sản phẩm nào với từ khóa "${query}"`
                  : 'Vui lòng nhập từ khóa tìm kiếm hoặc chọn bộ lọc'}
              </p>
              <p style={{ color: 'var(--muted)' }}>
                Thử tìm kiếm với từ khóa khác hoặc xem{' '}
                <Link to="/category/all" style={{ color: 'var(--accent)' }}>
                  tất cả sản phẩm
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid">
              {items.map(p => (
                <article className="product-card" key={p.id}>
                  <Link className="card-link" to={`/product/${p.id}`}>
                    <div className="product-media"><img src={p.imageUrl} alt={p.name} /></div>
                    <h3>{p.name}</h3>
                    {p.descriptionShort && <p>{p.descriptionShort}</p>}
                    <div className="price">{Number(p.price).toLocaleString('vi-VN')}₫</div>
                  </Link>
                  <button className="btn-primary" onClick={() => add(p.id, 1)}>Thêm vào giỏ</button>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
