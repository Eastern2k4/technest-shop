# Hướng dẫn dọn dẹp dung lượng - Mức độ an toàn

## ✅ HOÀN TOÀN AN TOÀN (Có thể chạy ngay)

### 1. Flutter Clean
```bash
flutter clean
```
- **Xóa gì**: Thư mục `build/` và `.dart_tool/` (file build tạm)
- **Rủi ro**: Không có
- **Lợi ích**: Giải phóng vài trăm MB đến vài GB
- **Lưu ý**: Sau khi clean, chạy `flutter pub get` và build lại

### 2. Homebrew Cleanup
```bash
brew cleanup
```
- **Xóa gì**: Cache và phiên bản cũ của packages
- **Rủi ro**: Không có
- **Lợi ích**: Giải phóng vài trăm MB đến vài GB
- **Lưu ý**: Có thể tải lại packages sau nếu cần

## ⚠️ AN TOÀN NHƯNG CẦN CẨN THẬN

### 3. Xóa Xcode DerivedData
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```
- **Xóa gì**: Cache build của Xcode
- **Rủi ro**: Lần build đầu tiên sẽ chậm hơn (Xcode phải build lại)
- **Lợi ích**: Giải phóng vài GB (nếu có nhiều project)
- **Lưu ý**: Code và project không bị ảnh hưởng

## 🔴 CẦN CẨN THẬN (Chỉ làm thủ công)

### 4. Dọn dẹp macOS Storage
- **An toàn**: Xóa file trong Trash, Downloads cũ, file lớn không dùng
- **Nguy hiểm**: Xóa nhầm file hệ thống hoặc file quan trọng
- **Cách an toàn**: 
  - Vào Apple menu > About This Mac > Storage > Manage
  - Xem từng mục và xóa thủ công
  - KHÔNG xóa các file trong:
    - `/System/`
    - `/Library/` (trừ DerivedData)
    - `~/Library/Application Support/` (trừ khi chắc chắn)

## 📊 Ước tính dung lượng giải phóng

| Bước | Dung lượng giải phóng | Mức độ an toàn |
|------|----------------------|----------------|
| `flutter clean` | 100MB - 2GB | ✅ Hoàn toàn an toàn |
| `brew cleanup` | 500MB - 3GB | ✅ Hoàn toàn an toàn |
| Xóa DerivedData | 1GB - 10GB | ⚠️ An toàn (chậm build lần đầu) |
| Dọn dẹp macOS | 5GB - 50GB+ | 🔴 Cần cẩn thận |

## 🎯 Khuyến nghị

**Bước 1**: Chạy các lệnh an toàn trước:
```bash
flutter clean
brew cleanup
```

**Bước 2**: Kiểm tra dung lượng còn lại:
```bash
df -h /
```

**Bước 3**: Nếu vẫn thiếu, xóa DerivedData:
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/*
```

**Bước 4**: Nếu vẫn thiếu, dọn dẹp macOS thủ công qua Storage Management

## ⚠️ LƯU Ý QUAN TRỌNG

- **KHÔNG** chạy `sudo rm -rf /` hoặc các lệnh xóa hệ thống
- **KHÔNG** xóa các file trong `/System/` hoặc `/Library/` (trừ DerivedData)
- **LUÔN** kiểm tra dung lượng trước và sau khi dọn dẹp
- **SAO LƯU** các file quan trọng trước khi xóa (nếu không chắc chắn)

