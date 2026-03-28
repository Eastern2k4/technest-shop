import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext.jsx'
import { ProductsAPI, getErrorMessage } from '../lib/api.js'
import { COMMON_PRODUCT_BRANDS } from '../lib/productBrands.js'

export default function Category() {
  const { cat } = useParams()
  const { add } = useCart()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({ q: '', minPrice: '', maxPrice: '', brand: '' })
  const [appliedFilters, setAppliedFilters] = useState({ q: '', minPrice: '', maxPrice: '', brand: '' })
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    loadProducts()
  }, [cat, appliedFilters, sort])

  async function loadProducts() {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductsAPI.list({
        cat,
        q: appliedFilters.q,
        minPrice: appliedFilters.minPrice,
        maxPrice: appliedFilters.maxPrice,
        brand: appliedFilters.brand,
      })
      let products = Array.isArray(data) ? data : []

      if (sort === 'priceAsc') {
        products = [...products].sort((a, b) => Number(a.price) - Number(b.price))
      } else if (sort === 'priceDesc') {
        products = [...products].sort((a, b) => Number(b.price) - Number(a.price))
      } else if (sort === 'nameAsc') {
        products = [...products].sort((a, b) => a.name.localeCompare(b.name))
      }

      setItems(products)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(getErrorMessage(err, 'Không thể tải sản phẩm.'))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  function onFilterSubmit(e) {
    e.preventDefault()
    setAppliedFilters(filters)
  }

  function resetFilters() {
    const reset = { q: '', minPrice: '', maxPrice: '', brand: '' }
    setFilters(reset)
    setAppliedFilters(reset)
  }

  const title = useMemo(() => {
    if (!cat || cat === 'all') return 'Tất cả sản phẩm'
    const map = { phone: 'Điện thoại', laptop: 'Laptop', screen: 'Màn hình', headphones: 'Tai nghe', accessories: 'Phụ kiện' }
    return map[cat.toLowerCase()] || cat
  }, [cat])

  if (loading) {
    return (
      <main className="section">
        <div className="container">
          <h1>{cat === 'all' ? 'Tất cả sản phẩm' : cat}</h1>
          <p>Đang tải...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="section">
        <div className="container">
          <h1>{cat === 'all' ? 'Tất cả sản phẩm' : cat}</h1>
          <p style={{ color: 'red' }}>Lỗi: {error}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="section">
      <div className="container">
        <h1>{title}</h1>
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          onSubmit={onFilterSubmit}
          onReset={resetFilters}
          sort={sort}
          setSort={setSort}
        />
        {items.length === 0 ? (
          <p>Không có sản phẩm nào.</p>
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
    </main>
  )
}

function FiltersPanel({ filters, setFilters, onSubmit, onReset, sort, setSort }) {
  return (
    <form onSubmit={onSubmit} style={{ background: 'var(--bg-secondary, #f9fafb)', padding: 16, borderRadius: 8, marginBottom: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <div>
          <label className="filter-label">Tìm kiếm</label>
          <input
            type="text"
            value={filters.q}
            onChange={e => setFilters(prev => ({ ...prev, q: e.target.value }))}
            placeholder="Tên sản phẩm"
            className="input"
          />
        </div>
        <div>
          <label className="filter-label">Giá từ</label>
          <input
            type="number"
            min="0"
            value={filters.minPrice}
            onChange={e => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
            placeholder="Min"
            className="input"
          />
        </div>
        <div>
          <label className="filter-label">Đến</label>
          <input
            type="number"
            min="0"
            value={filters.maxPrice}
            onChange={e => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
            placeholder="Max"
            className="input"
          />
        </div>
        <div>
          <label className="filter-label">Thương hiệu</label>
          <select
            value={filters.brand}
            onChange={e => setFilters(prev => ({ ...prev, brand: e.target.value }))}
            className="input"
          >
            <option value="">Tất cả</option>
            {COMMON_PRODUCT_BRANDS.map((brand) => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="filter-label">Sắp xếp</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="input"
          >
            <option value="featured">Nổi bật</option>
            <option value="priceAsc">Giá tăng dần</option>
            <option value="priceDesc">Giá giảm dần</option>
            <option value="nameAsc">Tên (A-Z)</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <button type="submit" className="btn-primary">Áp dụng</button>
        <button type="button" className="btn-ghost" onClick={onReset}>Đặt lại</button>
      </div>
    </form>
  )
}
