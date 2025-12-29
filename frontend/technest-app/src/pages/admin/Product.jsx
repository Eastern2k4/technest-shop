import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { api } from '../../lib/api.js'

export default function AdminProducts() {
  const { authHeader } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])

  async function loadCategories() {
    try {
      const data = await api('/api/categories')
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  async function loadProducts() {
    try {
      setLoading(true)
      setError('')
      const data = await api('/api/products?cat=all')
      setProducts(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return '↕'
    return sortDir === 'asc' ? '▲' : '▼'
  }

  const sortedProducts = [...products].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortKey === 'id') return (a.id - b.id) * dir
    if (sortKey === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'vi', { sensitivity: 'base' }) * dir
    if (sortKey === 'price') return (Number(a.price || 0) - Number(b.price || 0)) * dir
    if (sortKey === 'stock') return (Number(a.quantity || 0) - Number(b.quantity || 0)) * dir
    if (sortKey === 'category') return String(a.categoryName || '').localeCompare(String(b.categoryName || ''), 'vi', { sensitivity: 'base' }) * dir
    return 0
  })

  function handleNew() {
    setEditingProduct(null)
    setShowModal(true)
  }

  function handleEdit(product) {
    setEditingProduct(product)
    setShowModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this product?')) return
    
    try {
      await api(`/api/products/${id}`, { method: 'DELETE' })
      loadProducts()
    } catch (err) {
      alert('Failed to delete product: ' + err.message)
    }
  }

  async function handleSave(formData) {
    try {
      setError('')
      const payload = {
        name: formData.get('name'),
        price: parseFloat(formData.get('price')),
        imageUrl: formData.get('imageUrl'),
        categoryId: formData.get('categoryId') ? parseInt(formData.get('categoryId')) : null,
        quantity: parseInt(formData.get('quantity') || '0'),
        descriptionShort: formData.get('descriptionShort'),
        descriptionLong: formData.get('descriptionLong')
      }

      if (editingProduct) {
        await api(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: payload
        })
      } else {
        await api('/api/products', {
          method: 'POST',
          body: payload
        })
      }
      
      setShowModal(false)
      loadProducts()
    } catch (err) {
      setError(err.message || 'Failed to save product')
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Manage Products</h1>
        <button 
          onClick={handleNew}
          style={{ padding: "8px 16px", background: "#0066cc", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          + New Product
        </button>
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", border: "1px solid #eee" }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th align="left" style={{ cursor: 'pointer' }} onClick={() => toggleSort('id')}>
              ID {sortIndicator('id')}
            </th>
            <th align="left">Image</th>
            <th align="left" style={{ cursor: 'pointer' }} onClick={() => toggleSort('name')}>
              Name {sortIndicator('name')}
            </th>
            <th align="left" style={{ cursor: 'pointer' }} onClick={() => toggleSort('price')}>
              Price {sortIndicator('price')}
            </th>
            <th align="left" style={{ cursor: 'pointer' }} onClick={() => toggleSort('stock')}>
              Stock {sortIndicator('stock')}
            </th>
            <th align="left" style={{ cursor: 'pointer' }} onClick={() => toggleSort('category')}>
              Category {sortIndicator('category')}
            </th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No products found</td>
            </tr>
          ) : (
            sortedProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt={p.name} style={{ width: 50, height: 50, objectFit: 'cover' }} />
                  )}
                </td>
                <td>{p.name}</td>
                <td>{Number(p.price || 0).toLocaleString('vi-VN')}₫</td>
                <td>{p.quantity || 0}</td>
                <td>{p.categoryName || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(p)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(p.id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setError('') }}
          onSave={handleSave}
          error={error}
        />
      )}
    </div>
  )
}

function ProductModal({ product, categories, onClose, onSave, error }) {
  function handleSubmit(e) {
    e.preventDefault()
    onSave(new FormData(e.target))
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 8,
        width: '90%',
        maxWidth: 600,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>{product ? 'Edit Product' : 'New Product'}</h2>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Name *</label>
            <input
              name="name"
              type="text"
              required
              defaultValue={product?.name || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Price *</label>
            <input
              name="price"
              type="number"
              step="0.01"
              required
              defaultValue={product?.price || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Image URL</label>
            <input
              name="imageUrl"
              type="url"
              defaultValue={product?.imageUrl || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Category</label>
            <select
              name="categoryId"
              defaultValue={product?.categoryId || ''}
              style={{ width: '100%', padding: 8 }}
            >
              <option value="">None</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Quantity</label>
            <input
              name="quantity"
              type="number"
              min="0"
              defaultValue={product?.quantity || 0}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Short Description</label>
            <textarea
              name="descriptionShort"
              rows="3"
              defaultValue={product?.descriptionShort || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Long Description</label>
            <textarea
              name="descriptionLong"
              rows="5"
              defaultValue={product?.descriptionLong || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" style={{ background: '#0066cc', color: 'white', padding: '8px 16px', border: 'none', borderRadius: 4 }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
