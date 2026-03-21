import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

export default function StaffInventory() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null)
  const [editForm, setEditForm] = useState({ 
    name: '', 
    price: '', 
    quantity: '', 
    imageUrl: '',
    categoryId: '',
    descriptionShort: '',
    descriptionLong: ''
  })

  useEffect(() => {
    loadCategories()
    loadProducts()
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
      setError(null)
      const data = await api('/api/products?size=1000')
      const productList = Array.isArray(data) ? data : (data?.content || [])
      setProducts(productList)
    } catch (err) {
      console.error('Error loading products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(product) {
    setEditing(product.id)
    setEditForm({ 
      name: product.name || '',
      price: product.price || '',
      quantity: product.quantity || 0,
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId || '',
      descriptionShort: product.descriptionShort || '',
      descriptionLong: product.descriptionLong || ''
    })
  }

  function cancelEdit() {
    setEditing(null)
    setEditForm({ name: '', price: '', quantity: '', imageUrl: '', categoryId: '', descriptionShort: '', descriptionLong: '' })
  }

  async function saveProduct(productId) {
    try {
      const product = products.find(p => p.id === productId)
      if (!product) return

      const quantity = parseInt(editForm.quantity) || 0
      const price = parseFloat(editForm.price) || 0
      
      if (quantity < 0) {
        alert('Quantity cannot be negative')
        return
      }
      if (price < 0) {
        alert('Price cannot be negative')
        return
      }
      if (!editForm.name || editForm.name.trim() === '') {
        alert('Product name is required')
        return
      }

      // Prepare update payload matching ProductDTO structure
      const updated = {
        id: product.id,
        name: editForm.name.trim(),
        price: price,
        imageUrl: editForm.imageUrl.trim() || '',
        categoryId: editForm.categoryId ? parseInt(editForm.categoryId) : product.categoryId,
        quantity: quantity,
        descriptionShort: editForm.descriptionShort.trim() || '',
        descriptionLong: editForm.descriptionLong.trim() || ''
      }

      const response = await api(`/api/products/${productId}`, {
        method: 'PUT',
        body: updated
      })

      // Update local state with response from API (includes categoryName)
      setProducts(products.map(p => p.id === productId ? response : p))
      setEditing(null)
      setEditForm({ name: '', price: '', quantity: '', imageUrl: '', categoryId: '' })
    } catch (err) {
      console.error('Error updating product:', err)
      alert('Failed to update product: ' + (err.message || 'Unknown error'))
    }
  }

  const lowStockProducts = products.filter(p => (p.quantity || 0) < 10)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Inventory</h1>
        <button 
          className="btn-primary" 
          onClick={loadProducts}
          style={{ padding: '8px 16px' }}
        >
          Refresh
        </button>
      </div>

      {lowStockProducts.length > 0 && (
        <div style={{ 
          background: '#fff3cd', 
          border: '1px solid #ffc107', 
          borderRadius: 8, 
          padding: 12, 
          marginBottom: 16 
        }}>
          <strong>⚠️ Warning:</strong> {lowStockProducts.length} product(s) have low stock (&lt;10 units)
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <div style={{ color: 'red' }}>Error: {error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table width="100%" cellPadding="12" style={{ 
            borderCollapse: "collapse", 
            border: "1px solid var(--border, #eee)",
            background: 'var(--bg, #fff)'
          }}>
            <thead>
              <tr style={{ background: "var(--bg-secondary, #fafafa)" }}>
                <th align="left" style={{ width: '60px' }}>Image</th>
                <th align="left">ID</th>
                <th align="left">Name</th>
                <th align="left">Price</th>
                <th align="left">Stock</th>
                <th align="left">Category</th>
                <th align="left">Image URL</th>
                <th align="left">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: 24, color: 'var(--muted, #666)' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const imageUrl = p.imageUrl || ''
                  const hasImage = imageUrl && imageUrl.trim() !== '' && imageUrl !== 'null'
                  const isEditing = editing === p.id
                  return (
                    <>
                    <tr 
                      key={p.id}
                      style={{ 
                        borderTop: '1px solid var(--border, #eee)',
                        ...((p.quantity || 0) < 10 ? { background: '#fff3cd20' } : {}),
                        ...(isEditing ? { background: '#e3f2fd' } : {})
                      }}
                    >
                      <td>
                        {hasImage ? (
                          <img 
                            src={imageUrl} 
                            alt={p.name}
                            style={{
                              width: 50,
                              height: 50,
                              objectFit: 'cover',
                              borderRadius: 4,
                              border: '1px solid var(--border, #eee)'
                            }}
                            onError={(e) => {
                              e.target.onerror = null
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E'
                            }}
                          />
                        ) : (
                          <div 
                            style={{
                              width: 50,
                              height: 50,
                              background: 'var(--bg-secondary, #f5f5f5)',
                              border: '1px solid var(--border, #eee)',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              color: 'var(--muted, #999)',
                              textAlign: 'center'
                            }}
                          >
                            No Image
                          </div>
                        )}
                      </td>
                      <td>{p.id}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
                            placeholder="Product name"
                          />
                        ) : (
                          p.name
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.price}
                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                            min="0"
                            step="0.01"
                            style={{ width: 100, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
                            placeholder="Price"
                          />
                        ) : (
                          Number(p.price).toLocaleString('vi-VN') + '₫'
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                            min="0"
                            style={{ width: 80, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
                            placeholder="Stock"
                          />
                        ) : (
                          <span style={{ 
                            color: (p.quantity || 0) < 10 ? '#d32f2f' : 'inherit',
                            fontWeight: (p.quantity || 0) < 10 ? 600 : 'normal'
                          }}>
                            {p.quantity || 0}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <select
                            value={editForm.categoryId}
                            onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                            style={{ width: '100%', padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4 }}
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        ) : (
                          p.categoryName || 'N/A'
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="url"
                            value={editForm.imageUrl}
                            onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                            style={{ width: 200, padding: '4px 8px', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }}
                            placeholder="https://example.com/image.jpg"
                          />
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--muted, #666)', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {imageUrl || 'No URL'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                            <button 
                              className="btn-primary" 
                              onClick={() => saveProduct(p.id)}
                              style={{ padding: '4px 12px', fontSize: 14 }}
                            >
                              Save
                            </button>
                            <button 
                              className="btn-ghost" 
                              onClick={cancelEdit}
                              style={{ padding: '4px 12px', fontSize: 14 }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button 
                              className="btn-primary" 
                              onClick={() => startEdit(p)}
                              style={{ padding: '4px 12px', fontSize: 14 }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {isEditing && (
                      <tr>
                        <td colSpan="8" style={{ padding: 16, background: '#f9f9f9' }}>
                          <div style={{ display: 'grid', gap: 16 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Mô tả ngắn (hiển thị trên danh sách)
                              </label>
                              <textarea
                                value={editForm.descriptionShort}
                                onChange={(e) => setEditForm({ ...editForm, descriptionShort: e.target.value })}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  border: '1px solid #ddd', 
                                  borderRadius: 4,
                                  minHeight: 80,
                                  fontFamily: 'inherit',
                                  fontSize: 14
                                }}
                                placeholder="Mô tả ngắn về sản phẩm (hiển thị trên trang danh sách)"
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                                Mô tả chi tiết (hiển thị trên trang chi tiết)
                              </label>
                              <textarea
                                value={editForm.descriptionLong}
                                onChange={(e) => setEditForm({ ...editForm, descriptionLong: e.target.value })}
                                style={{ 
                                  width: '100%', 
                                  padding: '8px', 
                                  border: '1px solid #ddd', 
                                  borderRadius: 4,
                                  minHeight: 150,
                                  fontFamily: 'inherit',
                                  fontSize: 14
                                }}
                                placeholder="Mô tả chi tiết về sản phẩm (hiển thị trên trang chi tiết sản phẩm)"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
