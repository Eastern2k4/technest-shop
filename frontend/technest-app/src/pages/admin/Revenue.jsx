// src/pages/admin/Revenue.jsx
import { useEffect, useState } from 'react'
import { StatisticsAPI, getErrorMessage } from '../../lib/api.js'

export default function AdminRevenue() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exportFrom, setExportFrom] = useState('')
  const [exportTo, setExportTo] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      setError('')
      const res = await StatisticsAPI.revenueDetails()
      setData(res)
    } catch (err) {
      console.error('Error loading revenue:', err)
      setError(getErrorMessage(err, 'Failed to load revenue data'))
    } finally {
      setLoading(false)
    }
  }

  async function exportCsv() {
    try {
      const csv = await StatisticsAPI.exportCsv({
        from: exportFrom,
        to: exportTo,
      })
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = 'revenue.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to export CSV'))
    }
  }

  if (loading) return <div>Đang tải...</div>
  if (error) return <div style={{ color: 'red' }}>Lỗi: {error}</div>
  if (!data) return null

  const { dayRevenue, monthRevenue, yearRevenue, dailySeries = [], monthlySeries = [] } = data

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 24 
      }}>
        <h1 style={{ margin: 0 }}>Revenue</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-primary" onClick={loadData}>Refresh</button>
        </div>
      </div>

      {/* cards số liệu */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 32
      }}>
        <RevenueCard label="Doanh thu hôm nay" value={dayRevenue} />
        <RevenueCard label="Doanh thu tháng này" value={monthRevenue} />
        <RevenueCard label="Doanh thu năm nay" value={yearRevenue} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: 24,
        alignItems: 'end'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Từ ngày</label>
          <input
            type="date"
            value={exportFrom}
            onChange={e => setExportFrom(e.target.value)}
            style={{ padding: '6px 8px', width: '100%' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, marginBottom: 4 }}>Đến ngày</label>
          <input
            type="date"
            value={exportTo}
            onChange={e => setExportTo(e.target.value)}
            style={{ padding: '6px 8px', width: '100%' }}
          />
        </div>
        <div>
          <button className="btn-primary" onClick={exportCsv}>Xuất CSV</button>
        </div>
      </div>

      {/* biểu đồ */}
      <div style={{ display: 'grid', gap: 24 }}>
        <section style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #eee'
        }}>
          <h2 style={{ margin: '0 0 12px' }}>Doanh thu 7 ngày gần nhất</h2>
          <BarChart
            data={dailySeries.map(d => ({
              label: d.date,
              value: d.revenue
            }))}
          />
        </section>

        <section style={{
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          border: '1px solid #eee'
        }}>
          <h2 style={{ margin: '0 0 12px' }}>Doanh thu 12 tháng gần nhất</h2>
          <BarChart
            data={monthlySeries.map(m => ({
              label: m.month,
              value: m.revenue
            }))}
          />
        </section>
      </div>
    </div>
  )
}

function RevenueCard({ label, value }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 8,
      border: '1px solid #eee',
      background: '#fff'
    }}>
      <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>
        {Number(value || 0).toLocaleString('vi-VN')}₫
      </div>
    </div>
  )
}

function BarChart({ data }) {
  if (!data || data.length === 0) return <p>Không có dữ liệu</p>

  const values = data.map(d => Number(d.value || 0))
  const max = Math.max(...values, 0)

  return (
    <div style={{ height: 260 }}>
      <div style={{
        height: 200,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 8
      }}>
        {data.map((d, idx) => {
          const v = Number(d.value || 0)
          const heightPercent = max > 0 ? (v / max) * 100 : 0
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
            >
              <div style={{
                height: 180,
                width: '100%',
                display: 'flex',
                alignItems: 'flex-end'
              }}>
                <div style={{
                  width: '100%',
                  height: `${heightPercent}%`,
                  borderRadius: 4,
                  background: '#4f46e5'
                }} />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{
        marginTop: 6,
        display: 'flex',
        gap: 8,
        fontSize: 10
      }}>
        {data.map((d, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
