import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

const RESPONSES = {
  'hello': 'Xin chào! Tôi là chatbot hỗ trợ của TechNest. Tôi có thể giúp bạn với:\n• Thông tin sản phẩm\n• Hướng dẫn đặt hàng\n• Theo dõi đơn hàng\n• Chính sách đổi trả\n• Hỗ trợ kỹ thuật\n\nBạn cần hỗ trợ gì?',
  'hi': 'Xin chào! Tôi có thể giúp gì cho bạn?',
  'help': 'Tôi có thể giúp bạn với:\n\n📦 **Thông tin sản phẩm**\n- Xem danh sách sản phẩm\n- Tìm kiếm sản phẩm\n- So sánh sản phẩm\n\n🛒 **Hướng dẫn đặt hàng**\n- Cách thêm vào giỏ hàng\n- Quy trình thanh toán\n- Phương thức vận chuyển\n\n📋 **Theo dõi đơn hàng**\n- Kiểm tra trạng thái đơn hàng\n- Lịch sử mua hàng\n\n🔄 **Chính sách đổi trả**\n- Điều kiện đổi trả\n- Thời gian xử lý\n\n💻 **Hỗ trợ kỹ thuật**\n- Hướng dẫn sử dụng\n- Giải đáp thắc mắc',
  'product': 'Bạn có thể xem danh sách sản phẩm tại trang **Catalog**. Chúng tôi có:\n\n📱 **Điện thoại** - iPhone, Samsung, Xiaomi...\n💻 **Laptop** - MacBook, Dell, HP, Lenovo...\n🖥️ **Màn hình** - 4K, Gaming, Ultrawide...\n🎧 **Tai nghe** - AirPods, Sony, Bose...\n⌚ **Phụ kiện** - Apple Watch, Sạc, Ốp lưng...\n\nBạn muốn tìm sản phẩm nào cụ thể?',
  'order': 'Để đặt hàng, bạn làm theo các bước sau:\n\n1️⃣ **Thêm sản phẩm vào giỏ hàng**\n   - Click vào sản phẩm bạn muốn mua\n   - Chọn số lượng\n   - Click "Thêm vào giỏ hàng"\n\n2️⃣ **Kiểm tra giỏ hàng**\n   - Click vào icon giỏ hàng ở header\n   - Xem lại sản phẩm đã chọn\n\n3️⃣ **Điền thông tin địa chỉ**\n   - Họ và tên\n   - Số điện thoại\n   - Địa chỉ giao hàng\n   - Tỉnh/Thành phố\n\n4️⃣ **Chọn phương thức thanh toán**\n   - COD (Thanh toán khi nhận hàng)\n   - Chuyển khoản ngân hàng\n   - Thẻ tín dụng/ghi nợ\n\n5️⃣ **Xác nhận đơn hàng**\n   - Click "Đặt hàng"\n   - Nhận mã đơn hàng\n\nBạn cần hỗ trợ thêm gì không?',
  'track': 'Để theo dõi đơn hàng:\n\n1. **Đăng nhập** vào tài khoản của bạn\n2. Vào **"My Profile"** (trên header)\n3. Cuộn xuống phần **"Lịch sử đơn hàng"**\n4. Xem chi tiết từng đơn hàng\n\nBạn sẽ thấy:\n• Mã đơn hàng\n• Ngày đặt hàng\n• Trạng thái (Đang xử lý, Đang giao, Đã giao...)\n• Tổng tiền\n• Chi tiết sản phẩm\n\nBạn có đơn hàng nào cần kiểm tra không?',
  'return': '**Chính sách đổi trả:**\n\n✅ **Điều kiện:**\n• Đổi trả trong vòng **7 ngày** kể từ ngày nhận hàng\n• Sản phẩm phải còn **nguyên vẹn**, chưa sử dụng\n• Còn đầy đủ **hộp, phụ kiện** đi kèm\n• Có **hóa đơn mua hàng**\n\n📞 **Quy trình:**\n1. Liên hệ hotline: **1900-xxxx**\n2. Cung cấp mã đơn hàng\n3. Nhân viên sẽ hướng dẫn chi tiết\n\n💰 **Hoàn tiền:**\n• Trong vòng 3-5 ngày làm việc\n• Về tài khoản đã thanh toán\n\nBạn có sản phẩm nào cần đổi trả không?',
  'shipping': '**Thông tin vận chuyển:**\n\n💰 **Phí vận chuyển:**\n• **30.000₫** cho mọi đơn hàng\n• Miễn phí cho đơn hàng trên 500.000₫ (sắp có)\n\n⏱️ **Thời gian giao hàng:**\n• **2-5 ngày làm việc** (tùy khu vực)\n• Nội thành: 1-2 ngày\n• Tỉnh/thành khác: 3-5 ngày\n\n🚚 **Phương thức:**\n• Giao hàng tận nơi\n• Nhận hàng tại cửa hàng (sắp có)\n\nBạn ở khu vực nào? Tôi có thể ước tính thời gian giao hàng cho bạn.',
  'payment': '**Phương thức thanh toán:**\n\n💵 **1. COD (Thanh toán khi nhận hàng)**\n• Thanh toán bằng tiền mặt\n• Nhận hàng trước, thanh toán sau\n• Phù hợp mọi đơn hàng\n\n🏦 **2. Chuyển khoản ngân hàng**\n• Chuyển khoản qua ngân hàng\n• Thông tin sẽ gửi sau khi đặt hàng\n• Xác nhận trong 24h\n\n💳 **3. Thẻ tín dụng/ghi nợ**\n• Visa, Mastercard\n• Bảo mật 100%\n• Thanh toán ngay\n\nBạn muốn dùng phương thức nào?',
  'contact': '**Liên hệ với chúng tôi:**\n\n📧 **Email:**\nsupport@technest.com\n\n📞 **Hotline:**\n1900-xxxx\n(8:00 - 22:00 hàng ngày)\n\n🏢 **Địa chỉ:**\nTechNest Store\n123 Đường ABC, Quận XYZ\nTP. Hồ Chí Minh\n\n💬 **Chat trực tuyến:**\nBạn đang dùng tính năng này!\n\nBạn cần hỗ trợ gì cụ thể?',
  'price': '**Giá sản phẩm:**\n\nChúng tôi cam kết:\n✅ Giá tốt nhất thị trường\n✅ Cập nhật giá thường xuyên\n✅ Nhiều chương trình khuyến mãi\n\nBạn có thể:\n• Xem giá trên từng sản phẩm\n• So sánh giá giữa các sản phẩm\n• Theo dõi khuyến mãi trên trang chủ\n\nBạn muốn xem sản phẩm nào?',
  'warranty': '**Chính sách bảo hành:**\n\n✅ **Thời gian bảo hành:**\n• Điện thoại, Laptop: 12-24 tháng\n• Màn hình: 24-36 tháng\n• Tai nghe, Phụ kiện: 6-12 tháng\n\n🔧 **Dịch vụ:**\n• Bảo hành chính hãng\n• Đổi mới nếu lỗi trong 30 ngày\n• Hỗ trợ kỹ thuật miễn phí\n\nBạn có sản phẩm nào cần bảo hành không?',
  'default': 'Xin lỗi, tôi chưa hiểu rõ câu hỏi của bạn. 😅\n\nBạn có thể:\n• Gõ **"help"** để xem các câu hỏi thường gặp\n• Hỏi về **sản phẩm, đặt hàng, vận chuyển, thanh toán**\n• Liên hệ hotline **1900-xxxx** để được hỗ trợ trực tiếp\n\nTôi có thể giúp bạn với gì khác không?'
}

export default function Chatbot() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Xin chào! Tôi là chatbot hỗ trợ của TechNest. Tôi có thể giúp gì cho bạn?' }
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  // Reset chatbot when user changes
  useEffect(() => {
    setMessages([
      { type: 'bot', text: 'Xin chào! Tôi là chatbot hỗ trợ của TechNest. Tôi có thể giúp gì cho bạn?' }
    ])
    setIsOpen(false)
  }, [user?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase().trim()
    
    // Better matching with more keywords
    if (lowerMessage.match(/\b(hello|hi|hey|xin chào|chào|chào bạn|chào bot)\b/)) {
      return RESPONSES.hello
    }
    if (lowerMessage.match(/\b(help|giúp|hỗ trợ|trợ giúp|hướng dẫn)\b/)) {
      return RESPONSES.help
    }
    if (lowerMessage.match(/\b(product|sản phẩm|hàng|mặt hàng|đồ|thiết bị|điện thoại|laptop|màn hình|tai nghe)\b/)) {
      return RESPONSES.product
    }
    if (lowerMessage.match(/\b(order|đặt hàng|mua|mua hàng|mua sắm|checkout|thanh toán)\b/)) {
      return RESPONSES.order
    }
    if (lowerMessage.match(/\b(track|theo dõi|đơn hàng|đơn|order|kiểm tra đơn|trạng thái)\b/)) {
      return RESPONSES.track
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
    
    return RESPONSES.default
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = input.trim()
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setInput('')

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse = getResponse(userMessage)
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }])
    }, 500)
  }

  return (
    <>
      {/* Chat Button */}
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

      {/* Chat Window */}
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
          {/* Header */}
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
              <div style={{ fontSize: 12, opacity: 0.9 }}>Thường phản hồi trong vài giây</div>
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

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              background: '#f9fafb'
            }}
          >
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
          </div>

          {/* Input */}
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
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
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
