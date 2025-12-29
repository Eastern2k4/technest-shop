import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.js'

const RESPONSES = {
  'hello': 'Xin chào! Tôi là chatbot hỗ trợ của TechNest. Tôi có thể giúp bạn với:\n• Thông tin sản phẩm\n• Hướng dẫn đặt hàng\n• Theo dõi đơn hàng\n• Chính sách đổi trả\n• Hỗ trợ kỹ thuật\n\nBạn cần hỗ trợ gì?',
  'hi': 'Xin chào! Tôi có thể giúp gì cho bạn?',
  'help': 'Bạn có thể gõ các lệnh sau:\n\n📦 **Thông tin sản phẩm**\n- "xem danh sách sản phẩm"\n- "tìm iPhone 17 Pro"\n- "so sánh iPhone 17 Pro vs Xiaomi 14 Pro"\n- "chi tiết iPhone 17 Pro"\n\n🛒 **Hướng dẫn đặt hàng**\n- "cách thêm vào giỏ hàng"\n- "cách đặt hàng"\n- "phương thức thanh toán"\n- "phương thức vận chuyển"\n\n📋 **Theo dõi đơn hàng**\n- "đơn hàng của tôi"\n- "lịch sử mua hàng"\n- "kiểm tra trạng thái đơn"\n\n🔄 **Chính sách đổi trả**\n- "điều kiện đổi trả"\n- "thời gian xử lý"\n- "quy trình đổi trả"\n\n💻 **Hỗ trợ kỹ thuật**\n- "hỗ trợ kỹ thuật"\n- "hướng dẫn sử dụng"',
  'product': 'Bạn có thể xem danh sách sản phẩm tại trang **Catalog**. Chúng tôi có:\n\n📱 **Điện thoại** - iPhone, Samsung, Xiaomi...\n💻 **Laptop** - MacBook, Dell, HP, Lenovo...\n🖥️ **Màn hình** - 4K, Gaming, Ultrawide...\n🎧 **Tai nghe** - AirPods, Sony, Bose...\n⌚ **Phụ kiện** - Apple Watch, Sạc, Ốp lưng...\n\nBạn muốn tìm sản phẩm nào cụ thể?',
  'order': 'Để đặt hàng, bạn làm theo các bước sau:\n\n1️⃣ **Thêm sản phẩm vào giỏ hàng**\n   - Click vào sản phẩm bạn muốn mua\n   - Chọn số lượng\n   - Click "Thêm vào giỏ hàng"\n\n2️⃣ **Kiểm tra giỏ hàng**\n   - Click vào icon giỏ hàng ở header\n   - Xem lại sản phẩm đã chọn\n\n3️⃣ **Điền thông tin địa chỉ**\n   - Họ và tên\n   - Số điện thoại\n   - Địa chỉ giao hàng\n   - Tỉnh/Thành phố\n\n4️⃣ **Chọn phương thức thanh toán**\n   - COD (Thanh toán khi nhận hàng)\n   - Chuyển khoản ngân hàng\n   - Thẻ tín dụng/ghi nợ\n\n5️⃣ **Xác nhận đơn hàng**\n   - Click "Đặt hàng"\n   - Nhận mã đơn hàng\n\nBạn cần hỗ trợ thêm gì không?',
  'track': 'Để theo dõi đơn hàng:\n\n1. **Đăng nhập** vào tài khoản của bạn\n2. Vào **"My Profile"** (trên header)\n3. Cuộn xuống phần **"Lịch sử đơn hàng"**\n4. Xem chi tiết từng đơn hàng\n\nBạn sẽ thấy:\n• Mã đơn hàng\n• Ngày đặt hàng\n• Trạng thái (Đang xử lý, Đang giao, Đã giao...)\n• Tổng tiền\n• Chi tiết sản phẩm\n\nBạn có đơn hàng nào cần kiểm tra không?',
  'return': '**Chính sách đổi trả:**\n\n✅ **Điều kiện:**\n• Đổi trả trong vòng **7 ngày** kể từ ngày nhận hàng\n• Sản phẩm phải còn **nguyên vẹn**, chưa sử dụng\n• Còn đầy đủ **hộp, phụ kiện** đi kèm\n• Có **hóa đơn mua hàng**\n\n📞 **Quy trình:**\n1. Liên hệ hotline: **1900-xxxx**\n2. Cung cấp mã đơn hàng\n3. Nhân viên sẽ hướng dẫn chi tiết\n\n💰 **Hoàn tiền:**\n• Trong vòng 3-5 ngày làm việc\n• Về tài khoản đã thanh toán\n\nBạn có sản phẩm nào cần đổi trả không?',
  'shipping': '**Thông tin vận chuyển:**\n\n💰 **Phí vận chuyển:**\n• **30.000₫** cho mọi đơn hàng\n• Miễn phí cho đơn hàng trên 500.000₫ (sắp có)\n\n⏱️ **Thời gian giao hàng:**\n• **2-5 ngày làm việc** (tùy khu vực)\n• Nội thành: 1-2 ngày\n• Tỉnh/thành khác: 3-5 ngày\n\n🚚 **Phương thức:**\n• Giao hàng tận nơi\n• Nhận hàng tại cửa hàng (sắp có)\n\nBạn ở khu vực nào? Tôi có thể ước tính thời gian giao hàng cho bạn.',
  'payment': '**Phương thức thanh toán:**\n\n💵 **1. COD (Thanh toán khi nhận hàng)**\n• Thanh toán bằng tiền mặt\n• Nhận hàng trước, thanh toán sau\n• Phù hợp mọi đơn hàng\n\n🏦 **2. Chuyển khoản ngân hàng**\n• Chuyển khoản qua ngân hàng\n• Thông tin sẽ gửi sau khi đặt hàng\n• Xác nhận trong 24h\n\n💳 **3. Thẻ tín dụng/ghi nợ**\n• Visa, Mastercard\n• Bảo mật 100%\n• Thanh toán ngay\n\nBạn muốn dùng phương thức nào?',
  'contact': '**Liên hệ với chúng tôi:**\n\n📧 **Email:**\nsupport@technest.com\n\n📞 **Hotline:**\n1900-xxxx\n(8:00 - 22:00 hàng ngày)\n\n🏢 **Địa chỉ:**\nTechNest Store\n123 Đường ABC, Quận XYZ\nTP. Hồ Chí Minh\n\n💬 **Chat trực tuyến:**\nBạn đang dùng tính năng này!\n\nBạn cần hỗ trợ gì cụ thể?',
  'price': '**Giá sản phẩm:**\n\nChúng tôi cam kết:\n✅ Giá tốt nhất thị trường\n✅ Cập nhật giá thường xuyên\n✅ Nhiều chương trình khuyến mãi\n\nBạn có thể:\n• Xem giá trên từng sản phẩm\n• So sánh giá giữa các sản phẩm\n• Theo dõi khuyến mãi trên trang chủ\n\nBạn muốn xem sản phẩm nào?',
  'warranty': '**Chính sách bảo hành:**\n\n✅ **Thời gian bảo hành:**\n• Điện thoại, Laptop: 12-24 tháng\n• Màn hình: 24-36 tháng\n• Tai nghe, Phụ kiện: 6-12 tháng\n\n🔧 **Dịch vụ:**\n• Bảo hành chính hãng\n• Đổi mới nếu lỗi trong 30 ngày\n• Hỗ trợ kỹ thuật miễn phí\n\nBạn có sản phẩm nào cần bảo hành không?',
  'tech': '**Hỗ trợ kỹ thuật nhanh:**\n\n🔌 **Không lên nguồn**\n• Kiểm tra cáp sạc/nguồn\n• Thử ổ cắm khác\n• Nhấn giữ nút nguồn 10-15 giây\n\n📶 **Không kết nối mạng**\n• Bật/tắt Wi‑Fi\n• Quên mạng và kết nối lại\n• Khởi động lại thiết bị\n\n🧩 **Lỗi phần mềm**\n• Cập nhật phiên bản mới nhất\n• Xóa cache ứng dụng\n• Khôi phục cài đặt (nếu cần)\n\nNếu vẫn chưa giải quyết được, bạn hãy mô tả lỗi chi tiết để tôi hỗ trợ thêm.',
  'default': 'Mình chưa hiểu câu hỏi. Hãy gõ **"help"** để xem các lệnh có thể dùng.'
}

export default function ChatbotWithHistory() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [lastTopic, setLastTopic] = useState('')
  const messagesEndRef = useRef(null)

  // Load conversation history when user changes or chatbot opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversationHistory()
      loadProducts()
    }
  }, [isOpen, user?.id])

  async function loadProducts() {
    try {
      const data = await api('/api/products?size=1000')
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : Array.isArray(data?.data?.content)
            ? data.data.content
            : []
      setProducts(list)
    } catch (err) {
      console.error('Error loading products for chatbot:', err)
    }
  }

  // Reset when user changes
  useEffect(() => {
    if (!user) {
      setMessages([])
    }
  }, [user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function loadConversationHistory() {
    if (!user) return
    
    try {
      setLoading(true)
      // Try to load from localStorage first (simple approach)
      const saved = localStorage.getItem(`chat_history_${user.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
          return
        }
      }
      
      // If no saved history, start with welcome message
      setMessages([
        { type: 'bot', text: 'Xin chào! Tôi là chatbot hỗ trợ của TechNest. Tôi có thể giúp gì cho bạn?' }
      ])
    } catch (err) {
      console.error('Error loading conversation:', err)
      setMessages([
        { type: 'bot', text: 'Xin chào! Tôi là chatbot hỗ trợ của TechNest. Tôi có thể giúp gì cho bạn?' }
      ])
    } finally {
      setLoading(false)
    }
  }

  function saveConversationHistory(msgs) {
    if (!user) return
    try {
      localStorage.setItem(`chat_history_${user.id}`, JSON.stringify(msgs))
    } catch (err) {
      console.error('Error saving conversation:', err)
    }
  }

  const getResponse = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase().trim()
    const normalizeText = (text) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')

    const normMessage = normalizeText(userMessage)
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const searchProducts = (list, query, limit = 5) => {
      const q = normalizeText(query)
      if (!q) return []
      return list
        .filter(p => {
          const name = normalizeText(p.name || '')
          const category = normalizeText(p.categoryName || '')
          const shortDesc = normalizeText(p.descriptionShort || '')
          return name.includes(q) || category.includes(q) || shortDesc.includes(q)
        })
        .slice(0, limit)
    }

    const formatProductList = (list) => {
      if (!list.length) return null
      let response = '**Gợi ý sản phẩm:**\n\n'
      list.forEach((p, idx) => {
        response += `${idx + 1}. **${p.name}** - ${Number(p.price).toLocaleString('vi-VN')}₫\n`
      })
      response += '\nBạn muốn xem chi tiết sản phẩm nào?'
      return response
    }

    // Return policy / processing time
    if (normMessage.includes('thoi gian xu ly')) {
      setLastTopic('return_time')
      return '**Thời gian xử lý đổi trả:**\n\n• Tiếp nhận yêu cầu: trong 24h\n• Kiểm tra & xác nhận: 1-2 ngày\n• Hoàn tiền: 3-5 ngày làm việc'
    }
    if (normMessage.includes('quy trinh')) {
      setLastTopic('return_process')
      return '**Quy trình đổi trả:**\n\n1) Liên hệ hotline **1900-xxxx**\n2) Cung cấp **mã đơn hàng**\n3) Nhân viên xác nhận điều kiện\n4) Gửi hàng về theo hướng dẫn\n5) Hoàn tiền / đổi sản phẩm'
    }
    if (
      normMessage.includes('dieu kien doi tra') ||
      normMessage.includes('chinh sach doi tra') ||
      normMessage.startsWith('dieu kien') ||
      normMessage.includes('doi tra') ||
      normMessage.includes('doi hang') ||
      normMessage.includes('tra hang') ||
      normMessage.includes('hoan hang')
    ) {
      setLastTopic('return_condition')
      return '**Điều kiện đổi trả:**\n\n✅ Đổi trả trong **7 ngày** từ khi nhận hàng\n✅ Sản phẩm **nguyên vẹn**, chưa sử dụng\n✅ Đầy đủ **hộp và phụ kiện**\n✅ Có **hóa đơn mua hàng**'
    }
    if (lastTopic === 'return_process' && normMessage.match(/^[1-5]$/)) {
      const detail = {
        '1': 'Bước 1: Liên hệ hotline **1900-xxxx** hoặc chat để tạo yêu cầu đổi trả.',
        '2': 'Bước 2: Cung cấp **mã đơn hàng** và mô tả lý do đổi trả.',
        '3': 'Bước 3: Nhân viên xác nhận điều kiện và hướng dẫn gửi hàng.',
        '4': 'Bước 4: Gửi hàng về theo hướng dẫn (đóng gói đầy đủ phụ kiện).',
        '5': 'Bước 5: Hoàn tiền/đổi sản phẩm sau khi kiểm tra đạt điều kiện.'
      }
      return detail[normMessage] || RESPONSES.default
    }

    // Cart / add to cart
    if (normMessage.match(/\b(gio hang|them vao gio|them gio hang|them vao gio hang|add to cart)\b/)) {
      return 'Cách thêm vào giỏ hàng:\n\n1) Mở sản phẩm bạn muốn mua\n2) Chọn số lượng (nếu có)\n3) Bấm **"Thêm vào giỏ hàng"**\n\nSau đó vào **Giỏ hàng** ở header để kiểm tra và đặt hàng.'
    }

    // Order guidance / tracking
    if (normMessage.match(/\b(track|theo doi|don hang cua toi|kiem tra don|trang thai|lich su mua hang|lich su)\b/)) {
      if (!user) {
        return 'Bạn cần đăng nhập để xem trạng thái và lịch sử đơn hàng. Vào /signin để đăng nhập nhé.'
      }
      try {
        const orders = await api('/api/orders/me')
        if (!Array.isArray(orders) || orders.length === 0) {
          return 'Bạn chưa có đơn hàng nào.'
        }
        const top = orders.slice(0, 5)
        let response = '**Đơn hàng của bạn:**\n\n'
        top.forEach((o, idx) => {
          response += `${idx + 1}. **${o.orderNumber || o.id}** - ${o.status || 'PENDING'} - ${Number(o.total || 0).toLocaleString('vi-VN')}₫\n`
        })
        response += '\nVào **Profile → Lịch sử đơn hàng** để xem chi tiết.'
        return response
      } catch (err) {
        return RESPONSES.track
      }
    }
    if (normMessage.match(/\b(order|dat hang|mua hang|mua sam|checkout|thanh toan|cach dat hang|huong dan dat hang)\b/)) {
      return RESPONSES.order
    }

    const getProductList = async () => {
      if (products.length) return products
      try {
        const data = await api('/api/products?size=1000')
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data?.data?.content)
              ? data.data.content
              : []
        if (list.length) setProducts(list)
        return list
      } catch {
        return []
      }
    }

    if (normMessage.match(/\b(tim|search|find)\b/)) {
      const query = userMessage.replace(/tìm|search|find/gi, '').trim()
      if (!query) {
        return 'Bạn muốn tìm sản phẩm gì? Ví dụ: "tìm iPhone", "tìm tai nghe Sony".'
      }
      const productList = await getProductList()
      if (!productList.length) {
        return 'Tôi đang tải danh sách sản phẩm. Bạn thử lại sau vài giây nhé.'
      }
      const found = searchProducts(productList, query, 6)
      const listResponse = formatProductList(found)
      if (listResponse) return listResponse
      if (productList.length > 0) {
        const fallback = formatProductList(productList.slice(0, 5))
        if (fallback) return `${fallback}\n\nKhông tìm thấy đúng "${query}" nên tôi gợi ý vài sản phẩm khác.`
      }
      return `Không tìm thấy sản phẩm phù hợp với "${query}". Bạn muốn xem danh sách chung không?`
    }

    // Product comparison
    if (lowerMessage.match(/\b(so sánh|so sanh|compare|comparison|đối chiếu|vs)\b/)) {
      const separators = [' vs ', ' và ', ' va ', ',', ';', '|']
      let parts = [userMessage]
      separators.forEach(sep => {
        if (parts.length === 1 && userMessage.toLowerCase().includes(sep)) {
          parts = userMessage.split(sep)
        }
      })
      const queries = parts
        .map(p => p.replace(/so sánh|so sanh|compare|comparison|đối chiếu/gi, '').trim())
        .filter(Boolean)
      const productList = await getProductList()
      let matched = []
      if (queries.length >= 2) {
        queries.forEach(q => {
          const found = searchProducts(productList, q, 1)
          if (found.length) matched.push(found[0])
        })
      }
      if (matched.length < 2) {
        const fallback = productList.filter(p => normalizeText(userMessage).includes(normalizeText(p.name)))
        matched = [...new Map(fallback.map(p => [p.id, p])).values()].slice(0, 3)
      }
      if (matched.length >= 2) {
        let response = '**So sánh sản phẩm:**\n\n'
        matched.forEach((p, idx) => {
          response += `${idx + 1}. **${p.name}**\n`
          response += `   💰 Giá: ${Number(p.price).toLocaleString('vi-VN')}₫\n`
          if (p.descriptionShort) response += `   📝 ${p.descriptionShort.substring(0, 100)}...\n`
          response += `   🔗 /product/${p.id}\n\n`
        })
        response += 'Bạn muốn so sánh thêm thông số nào?'
        return response
      }
      return 'Để so sánh, hãy nhập 2 tên sản phẩm (ví dụ: "so sánh iPhone 15 vs Samsung S24").'
    }

    // Product information
    if (lowerMessage.match(/\b(thông tin sản phẩm|product info|chi tiết|details|thông tin|info)\b/)) {
      const productName = lowerMessage.match(/\b(iphone|samsung|xiaomi|macbook|dell|laptop|sony|bose)\w*\b/i)?.[0]
      if (productName) {
        const found = products.find(p => 
          p.name.toLowerCase().includes(productName.toLowerCase())
        )
        if (found) {
          return `**${found.name}**\n\n💰 **Giá:** ${Number(found.price).toLocaleString('vi-VN')}₫\n${found.descriptionShort ? `📝 **Mô tả:** ${found.descriptionShort}\n` : ''}${found.quantity ? `📦 **Tồn kho:** ${found.quantity} sản phẩm\n` : ''}`
        }
      }
      return 'Để xem thông tin sản phẩm:\n• Nhập tên sản phẩm (ví dụ: "thông tin iPhone")\n• Hoặc gõ "sản phẩm" để xem danh sách'
    }

    // General product query
    if (lowerMessage.match(/\b(product|sản phẩm|mặt hàng|thiết bị|điện thoại|laptop|màn hình|tai nghe|iphone|samsung)\b/)) {
      const productQuery = userMessage.replace(/sản phẩm|product|hàng|mặt hàng|đồ|thiết bị/gi, '').trim()
      const productList = await getProductList()
      if (!productList.length) {
        return 'Tôi đang tải danh sách sản phẩm. Bạn thử lại sau vài giây nhé.'
      }
      if (productQuery) {
        const found = searchProducts(productList, productQuery, 6)
        const listResponse = formatProductList(found)
        if (listResponse) return listResponse
      }
      if (productList.length > 0) {
        const topProducts = productList.slice(0, 5)
        let response = '**Danh sách sản phẩm nổi bật:**\n\n'
        topProducts.forEach((p, idx) => {
          response += `${idx + 1}. **${p.name}** - ${Number(p.price).toLocaleString('vi-VN')}₫\n`
        })
        response += '\n💡 Gõ "tìm iPhone" để tìm nhanh'
        return response
      }
      return RESPONSES.product
    }

    if (lowerMessage.match(/\b(hello|hi|hey|xin chào|chào|chào bạn|chào bot)\b/)) {
      return RESPONSES.hello
    }
    if (lowerMessage.match(/\b(help|giúp|hỗ trợ|trợ giúp|hướng dẫn)\b/)) {
      return RESPONSES.help
    }
    if (lowerMessage.match(/\b(order|đặt hàng|mua|mua hàng|mua sắm|checkout|thanh toán)\b/)) {
      return RESPONSES.order
    }
    if (lowerMessage.match(/\b(track|theo dõi|đơn hàng|đơn|order|kiểm tra đơn|trạng thái|lịch sử)\b/)) {
      if (!user) {
        return 'Bạn cần đăng nhập để xem trạng thái và lịch sử đơn hàng. Vào /signin để đăng nhập nhé.'
      }
      try {
        const orders = await api('/api/orders/me')
        if (!Array.isArray(orders) || orders.length === 0) {
          return 'Bạn chưa có đơn hàng nào.'
        }
        const top = orders.slice(0, 5)
        let response = '**Đơn hàng của bạn:**\n\n'
        top.forEach((o, idx) => {
          response += `${idx + 1}. **${o.orderNumber || o.id}** - ${o.status || 'PENDING'} - ${Number(o.total || 0).toLocaleString('vi-VN')}₫\n`
        })
        response += '\nVào **Profile → Lịch sử đơn hàng** để xem chi tiết.'
        return response
      } catch (err) {
        return RESPONSES.track
      }
    }
    if (lowerMessage.match(/\b(return|đổi trả|hoàn|hoàn hàng|đổi hàng|trả hàng)\b/)) {
      return RESPONSES.return
    }
    if (lowerMessage.match(/\b(shipping|vận chuyển|giao hàng|ship|phí ship|thời gian giao)\b/)) {
      return RESPONSES.shipping
    }
    if (lowerMessage.match(/\b(payment|thanh toán|tiền|trả tiền|cod|chuyển khoản|thẻ)\b/)) {
      return RESPONSES.payment
    }
    if (lowerMessage.match(/\b(contact|liên hệ|hotline|email|phone|số điện thoại|địa chỉ)\b/)) {
      return RESPONSES.contact
    }
    if (lowerMessage.match(/\b(price|giá|giá cả|giá tiền|bao nhiêu|cost)\b/)) {
      return RESPONSES.price
    }
    if (lowerMessage.match(/\b(warranty|bảo hành|bảo hành|garantie)\b/)) {
      return RESPONSES.warranty
    }
    if (lowerMessage.match(/\b(kỹ thuật|ky thuat|technical|hỗ trợ kỹ thuật|huong dan su dung|hướng dẫn sử dụng)\b/)) {
      return RESPONSES.tech
    }
    if (lowerMessage.match(/\b(giải đáp|thắc mắc|câu hỏi|hỏi|question|faq)\b/)) {
      return RESPONSES.help
    }
    
    return RESPONSES.default
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    const newMessages = [...messages, { type: 'user', text: userMessage }]
    setMessages(newMessages)
    setInput('')

    // Simulate bot thinking
    setTimeout(async () => {
      try {
        const botResponse = await getResponse(userMessage)
        const updatedMessages = [...newMessages, { type: 'bot', text: botResponse || RESPONSES.default }]
        setMessages(updatedMessages)
        saveConversationHistory(updatedMessages)
      } catch (err) {
        console.error('Chatbot error:', err)
        const updatedMessages = [...newMessages, { type: 'bot', text: RESPONSES.default }]
        setMessages(updatedMessages)
        saveConversationHistory(updatedMessages)
      }
    }, 500)
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            fontSize: 28,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          💬
        </button>
      )}

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            height: 500,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1001,
            border: '1px solid #e5e7eb'
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px 20px',
              borderRadius: '16px 16px 0 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>💬 Hỗ trợ khách hàng</div>
              <div style={{ fontSize: 12, opacity: 0.9 }}>Lịch sử được lưu tự động</div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#f9fafb'
            }}
          >
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                Đang tải lịch sử...
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: 12
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '10px 14px',
                        borderRadius: msg.type === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.type === 'user' 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : '#fff',
                        color: msg.type === 'user' ? 'white' : '#333',
                        fontSize: 14,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-line',
                        boxShadow: msg.type === 'user' ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <form
            onSubmit={handleSend}
            style={{
              padding: '12px',
              borderTop: '1px solid #e5e7eb',
              background: '#fff',
              borderRadius: '0 0 16px 16px'
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 20,
                  fontSize: 14,
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ➤
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
