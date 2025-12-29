import { useEffect, useState } from 'react'
import { api } from '../../lib/api.js'

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [roles, setRoles] = useState(['ADMIN', 'STAFF', 'CUSTOMER'])

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    try {
      setLoading(true)
      setError('')
      const data = await api('/api/admin/users')
      setUsers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  function handleNew() {
    setEditingUser(null)
    setShowModal(true)
  }

  function handleEdit(user) {
    setEditingUser(user)
    setShowModal(true)
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await api(`/api/admin/users/${id}`, { method: 'DELETE' })
      loadUsers()
    } catch (err) {
      alert('Failed to delete user: ' + err.message)
    }
  }

  async function handleSave(formData) {
    try {
      setError('')
      const payload = {
        email: formData.get('email'),
        username: formData.get('username'),
        password: formData.get('password'),
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        addressText: formData.get('addressText'),
        role: formData.get('role')
      }

      if (editingUser) {
        // Remove password if empty for update
        if (!payload.password) {
          delete payload.password
        }
        await api(`/api/admin/users/${editingUser.id}`, {
          method: 'PUT',
          body: payload
        })
      } else {
        if (!payload.password) {
          throw new Error('Password is required for new users')
        }
        await api('/api/admin/users', {
          method: 'POST',
          body: payload
        })
      }
      
      setShowModal(false)
      loadUsers()
    } catch (err) {
      setError(err.message || 'Failed to save user')
    }
  }

  if (loading) {
    return <div>Đang tải...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Manage Users</h1>
        <button 
          onClick={handleNew}
          style={{ padding: "8px 16px", background: "#0066cc", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}
        >
          + New User
        </button>
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      
      <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse", border: "1px solid #eee" }}>
        <thead>
          <tr style={{ background: "#fafafa" }}>
            <th align="left">ID</th>
            <th align="left">Name</th>
            <th align="left">Email</th>
            <th align="left">Username</th>
            <th align="left">Role</th>
            <th align="left">Phone</th>
            <th align="left">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: 20 }}>No users found</td>
            </tr>
          ) : (
            users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.fullName || '-'}</td>
                <td>{u.email}</td>
                <td>{u.username}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    background: u.role === 'ADMIN' ? '#dc2626' : u.role === 'STAFF' ? '#2563eb' : '#059669',
                    color: 'white'
                  }}>
                    {u.role}
                  </span>
                </td>
                <td>{u.phone || '-'}</td>
                <td>
                  <button onClick={() => handleEdit(u)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(u.id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {showModal && (
        <UserModal
          user={editingUser}
          roles={roles}
          onClose={() => { setShowModal(false); setError('') }}
          onSave={handleSave}
          error={error}
        />
      )}
    </div>
  )
}

function UserModal({ user, roles, onClose, onSave, error }) {
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
        maxWidth: 500,
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2>{user ? 'Edit User' : 'New User'}</h2>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Email *</label>
            <input
              name="email"
              type="email"
              required
              defaultValue={user?.email || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Username</label>
            <input
              name="username"
              type="text"
              defaultValue={user?.username || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>
              Password {user ? '(leave empty to keep current)' : '*'}
            </label>
            <input
              name="password"
              type="password"
              required={!user}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Full Name</label>
            <input
              name="fullName"
              type="text"
              defaultValue={user?.fullName || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Phone</label>
            <input
              name="phone"
              type="tel"
              defaultValue={user?.phone || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Address</label>
            <textarea
              name="addressText"
              rows="3"
              defaultValue={user?.addressText || ''}
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4 }}>Role *</label>
            <select
              name="role"
              required
              defaultValue={user?.role || 'CUSTOMER'}
              style={{ width: '100%', padding: 8 }}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
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
