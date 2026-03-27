import { Fragment, useEffect, useState } from 'react'
import FieldError from '../../components/FieldError.jsx'
import { CategoriesAPI, ProductsAPI, getErrorMessage, getValidationErrors } from '../../lib/api.js'

const emptyEditForm = {
  name: '',
  price: '',
  quantity: '',
  imageUrl: '',
  categoryId: '',
  descriptionShort: '',
  descriptionLong: '',
}

export default function StaffInventory() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saveMessage, setSaveMessage] = useState('')
  const [editing, setEditing] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [editForm, setEditForm] = useState(emptyEditForm)

  useEffect(() => {
    loadCategories()
    loadProducts()
  }, [])

  async function loadCategories() {
    try {
      const data = await CategoriesAPI.list()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải danh mục.'))
    }
  }

  async function loadProducts() {
    try {
      setLoading(true)
      setError(null)
      const data = await ProductsAPI.list({ cat: 'all' })
      const productList = Array.isArray(data) ? data : []
      setProducts(productList)
    } catch (err) {
      setError(getErrorMessage(err, 'Không thể tải sản phẩm.'))
    } finally {
      setLoading(false)
    }
  }

  function startEdit(product) {
    setEditing(product.id)
    setSaveMessage('')
    setError(null)
    setFieldErrors({})
    setEditForm({
      name: product.name || '',
      price: product.price || '',
      quantity: product.quantity || 0,
      imageUrl: product.imageUrl || '',
      categoryId: product.categoryId || '',
      descriptionShort: product.descriptionShort || '',
      descriptionLong: product.descriptionLong || '',
    })
  }

  function cancelEdit() {
    setEditing(null)
    setSaveMessage('')
    setFieldErrors({})
    setEditForm(emptyEditForm)
  }

  function updateEditField(field, value) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }))
    setFieldErrors((current) => ({
      ...current,
      [field]: '',
    }))
    setError(null)
  }

  async function saveProduct(productId) {
    try {
      const product = products.find((item) => item.id === productId)
      if (!product) {
        return
      }

      setSavingId(productId)
      setSaveMessage('')
      setError(null)
      setFieldErrors({})

      const quantity = Number.parseInt(editForm.quantity, 10)
      const price = Number.parseFloat(editForm.price)
      const nextErrors = {}

      if (!editForm.name.trim()) {
        nextErrors.name = 'Product name is required'
      }
      if (Number.isNaN(price) || price < 0) {
        nextErrors.price = 'Price must be greater than or equal to 0'
      }
      if (!Number.isInteger(quantity) || quantity < 0) {
        nextErrors.quantity = 'Quantity must be greater than or equal to 0'
      }

      if (Object.keys(nextErrors).length > 0) {
        setFieldErrors(nextErrors)
        return
      }

      const updated = {
        id: product.id,
        name: editForm.name.trim(),
        price,
        imageUrl: editForm.imageUrl.trim() || '',
        categoryId: editForm.categoryId ? Number.parseInt(editForm.categoryId, 10) : product.categoryId,
        quantity,
        descriptionShort: editForm.descriptionShort.trim() || '',
        descriptionLong: editForm.descriptionLong.trim() || '',
      }

      const response = await ProductsAPI.update(productId, updated)

      setProducts((current) => current.map((item) => (item.id === productId ? response : item)))
      setSaveMessage('Cập nhật sản phẩm thành công.')
      setEditing(null)
      setEditForm(emptyEditForm)
    } catch (err) {
      setFieldErrors(getValidationErrors(err))
      setError(getErrorMessage(err, 'Không thể cập nhật sản phẩm.'))
    } finally {
      setSavingId(null)
    }
  }

  const lowStockProducts = products.filter((product) => (product.quantity || 0) < 10)

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

      {saveMessage && (
        <div style={successBoxStyle}>
          {saveMessage}
        </div>
      )}

      {lowStockProducts.length > 0 && (
        <div style={warningBoxStyle}>
          <strong>Warning:</strong> {lowStockProducts.length} product(s) have low stock (&lt;10 units)
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <div style={{ color: 'red', marginBottom: 16 }}>Error: {error}</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            width="100%"
            cellPadding="12"
            style={{
              borderCollapse: 'collapse',
              border: '1px solid var(--border, #eee)',
              background: 'var(--bg, #fff)',
            }}
          >
            <thead>
              <tr style={{ background: 'var(--bg-secondary, #fafafa)' }}>
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
                products.map((product) => {
                  const imageUrl = product.imageUrl || ''
                  const hasImage = imageUrl && imageUrl.trim() !== '' && imageUrl !== 'null'
                  const isEditing = editing === product.id
                  const isSaving = savingId === product.id

                  return (
                    <Fragment key={product.id}>
                      <tr
                        style={{
                          borderTop: '1px solid var(--border, #eee)',
                          ...((product.quantity || 0) < 10 ? { background: '#fff3cd20' } : {}),
                          ...(isEditing ? { background: '#e3f2fd' } : {}),
                        }}
                      >
                        <td>
                          {hasImage ? (
                            <img
                              src={imageUrl}
                              alt={product.name}
                              style={thumbnailStyle}
                              onError={(event) => {
                                event.target.onerror = null
                                event.target.src = fallbackImage
                              }}
                            />
                          ) : (
                            <div style={emptyImageStyle}>No Image</div>
                          )}
                        </td>
                        <td>{product.id}</td>
                        <td>
                          {isEditing ? (
                            <div>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(event) => updateEditField('name', event.target.value)}
                                style={tableInputStyle}
                                placeholder="Product name"
                              />
                              <FieldError message={fieldErrors.name} style={fieldErrorStyle} />
                            </div>
                          ) : (
                            product.name
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div>
                              <input
                                type="number"
                                value={editForm.price}
                                onChange={(event) => updateEditField('price', event.target.value)}
                                min="0"
                                step="0.01"
                                style={{ ...tableInputStyle, width: 100 }}
                                placeholder="Price"
                              />
                              <FieldError message={fieldErrors.price} style={fieldErrorStyle} />
                            </div>
                          ) : (
                            `${Number(product.price).toLocaleString('vi-VN')}₫`
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div>
                              <input
                                type="number"
                                value={editForm.quantity}
                                onChange={(event) => updateEditField('quantity', event.target.value)}
                                min="0"
                                style={{ ...tableInputStyle, width: 80 }}
                                placeholder="Stock"
                              />
                              <FieldError message={fieldErrors.quantity} style={fieldErrorStyle} />
                            </div>
                          ) : (
                            <span
                              style={{
                                color: (product.quantity || 0) < 10 ? '#d32f2f' : 'inherit',
                                fontWeight: (product.quantity || 0) < 10 ? 600 : 'normal',
                              }}
                            >
                              {product.quantity || 0}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div>
                              <select
                                value={editForm.categoryId}
                                onChange={(event) => updateEditField('categoryId', event.target.value)}
                                style={{ ...tableInputStyle, width: '100%' }}
                              >
                                <option value="">Select category</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </select>
                              <FieldError message={fieldErrors.categoryId} style={fieldErrorStyle} />
                            </div>
                          ) : (
                            product.categoryName || 'N/A'
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div>
                              <input
                                type="url"
                                value={editForm.imageUrl}
                                onChange={(event) => updateEditField('imageUrl', event.target.value)}
                                style={{ ...tableInputStyle, width: 200, fontSize: 12 }}
                                placeholder="https://example.com/image.jpg"
                              />
                              <FieldError message={fieldErrors.imageUrl} style={fieldErrorStyle} />
                            </div>
                          ) : (
                            <span style={urlTextStyle}>
                              {imageUrl || 'No URL'}
                            </span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                              <button
                                className="btn-primary"
                                onClick={() => saveProduct(product.id)}
                                disabled={isSaving}
                                style={{ padding: '4px 12px', fontSize: 14 }}
                              >
                                {isSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                className="btn-ghost"
                                onClick={cancelEdit}
                                disabled={isSaving}
                                style={{ padding: '4px 12px', fontSize: 14 }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <button
                                className="btn-primary"
                                onClick={() => startEdit(product)}
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
                                <label style={sectionLabelStyle}>
                                  Mô tả ngắn (hiển thị trên danh sách)
                                </label>
                                <textarea
                                  value={editForm.descriptionShort}
                                  onChange={(event) => updateEditField('descriptionShort', event.target.value)}
                                  style={{ ...textareaStyle, minHeight: 80 }}
                                  placeholder="Mô tả ngắn về sản phẩm"
                                />
                                <FieldError message={fieldErrors.descriptionShort} style={fieldErrorStyle} />
                              </div>
                              <div>
                                <label style={sectionLabelStyle}>
                                  Mô tả chi tiết (hiển thị trên trang chi tiết)
                                </label>
                                <textarea
                                  value={editForm.descriptionLong}
                                  onChange={(event) => updateEditField('descriptionLong', event.target.value)}
                                  style={{ ...textareaStyle, minHeight: 150 }}
                                  placeholder="Mô tả chi tiết về sản phẩm"
                                />
                                <FieldError message={fieldErrors.descriptionLong} style={fieldErrorStyle} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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

const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-size="10"%3ENo Image%3C/text%3E%3C/svg%3E'

const warningBoxStyle = {
  background: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
}

const successBoxStyle = {
  background: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: 8,
  padding: 12,
  marginBottom: 16,
  color: '#047857',
}

const tableInputStyle = {
  width: '100%',
  padding: '4px 8px',
  border: '1px solid #ddd',
  borderRadius: 4,
}

const fieldErrorStyle = {
  color: 'red',
  marginTop: 4,
  fontSize: 12,
  display: 'block',
}

const thumbnailStyle = {
  width: 50,
  height: 50,
  objectFit: 'cover',
  borderRadius: 4,
  border: '1px solid var(--border, #eee)',
}

const emptyImageStyle = {
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
  textAlign: 'center',
}

const urlTextStyle = {
  fontSize: 11,
  color: 'var(--muted, #666)',
  maxWidth: 200,
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const sectionLabelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  marginBottom: 8,
}

const textareaStyle = {
  width: '100%',
  padding: 8,
  border: '1px solid #ddd',
  borderRadius: 4,
  fontFamily: 'inherit',
  fontSize: 14,
}
