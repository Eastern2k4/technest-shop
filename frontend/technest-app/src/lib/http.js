export async function parseJsonSafe(res) {
    const ct = res.headers.get('content-type') || ''
    // 204 No Content hoặc không có body
    if (res.status === 204) return null
    // Nếu không phải JSON, đọc text để debug
    if (!ct.includes('application/json')) {
      const txt = await res.text()
      // Trả về null để FE tự xử, kèm attach _raw nếu muốn
      return txt ? { _raw: txt } : null
    }
    // JSON hợp lệ
    try {
      return await res.json()
    } catch {
      // body rỗng/JSON hỏng
      return null
    }
  }
  