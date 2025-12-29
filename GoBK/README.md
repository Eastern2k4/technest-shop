# GoBK - Ứng dụng đặt xe nội bộ trường BK

Ứng dụng Flutter để đặt xe nội bộ trong khuôn viên trường Bách Khoa.

## Cấu trúc dự án

Dự án được tổ chức theo mô hình MVC/MVVM:

```
lib/
├── main.dart              # Entry point và router configuration
├── screens/               # Các màn hình của ứng dụng
│   ├── login_screen.dart
│   ├── home_screen.dart
│   ├── ride_request_screen.dart
│   ├── driver_waiting_screen.dart
│   ├── ride_tracking_screen.dart
│   └── history_screen.dart
├── services/              # Business logic và API services
├── models/                # Data models
├── providers/             # State management (Provider)
├── widgets/               # Reusable widgets
└── utils/                 # Utility functions và helpers
```

## Routes

- `/login` - Màn hình đăng nhập
- `/home` - Màn hình chính
- `/ride_request` - Đặt xe mới
- `/driver_waiting` - Chờ tài xế
- `/ride_tracking` - Theo dõi chuyến xe
- `/history` - Lịch sử chuyến xe

## Theme

- Material 3
- Màu chủ đạo: #2ecc71 (xanh lá)

## Cài đặt

1. Cài đặt dependencies:
```bash
flutter pub get
```

## Chạy ứng dụng

### Chạy trên Web (Chrome)
```bash
flutter run -d chrome
```

### Chạy trên macOS Desktop
```bash
flutter run -d macos
```

### Chạy trên Mobile (iOS/Android)

**Để chạy trên mobile, bạn cần:**

1. **Cho Android:**
   - Cài đặt Android Studio
   - Tạo Android emulator hoặc kết nối thiết bị Android
   - Thêm Android platform:
     ```bash
     flutter create . --platforms=android
     ```
   - Chạy:
     ```bash
     flutter run -d android
     ```

2. **Cho iOS (chỉ trên macOS):**
   - Cài đặt Xcode từ App Store
   - Mở Xcode và chấp nhận license
   - Tạo iOS simulator hoặc kết nối iPhone
   - Thêm iOS platform:
     ```bash
     flutter create . --platforms=ios
     ```
   - Chạy:
     ```bash
     flutter run -d ios
     ```

3. **Xem danh sách thiết bị có sẵn:**
   ```bash
   flutter devices
   ```

4. **Xem danh sách emulators:**
   ```bash
   flutter emulators
   ```

## Dependencies

- `go_router`: ^13.0.0 - Routing
- `provider`: ^6.1.1 - State management
- `flutter`: SDK

