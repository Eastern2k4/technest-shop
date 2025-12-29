# 🛒 TechNest Backend – Spring Boot

Đây là mã nguồn Backend của hệ thống website bán hàng điện tử **TechNest**.  
Backend được xây dựng bằng **Java Spring Boot**, dùng để xử lý đăng nhập, đăng ký, sản phẩm, giỏ hàng, đặt hàng và quản lý đơn hàng.

---

## 🚀 1. Công nghệ sử dụng

- Java 17
- Spring Boot 3.x
- Spring Web
- Spring Security + JWT
- Spring Data JPA (Hibernate)
- MySQL
- Maven

---

## 📦 2. Cài đặt & chạy backend

### ✔ Bước 1 — Clone dự án

Tải source code từ file zip hoặc clone từ github

### ✔ Bước 2 — Mở backend

cd backend/ecommerce

### ✔ Bước 3 — Cấu hình database

Mở file:
src/main/resources/application.properties

Chỉnh:
spring.datasource.url=jdbc:mysql://127.0.0.1:3306/ecommerce_slim
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

### ✔ Bước 4 — Import database

Tạo database `ecommerce_slim` trong MySQL Workbench,  
sau đó chạy file SQL mà bạn đã export từ dự án.

### ✔ Bước 5 — Chạy backend

mvn spring-boot:run

Backend chạy trên:
👉 http://localhost:8080

---

## 🔑 3. Tài khoản mẫu

### Admin

email: admin@gmail.com
password: 123456

### User

email: dong@gmail.com
password: 123456

### Staff

email: testuser@example.com
password: 123456

---

## 📡 4. Một số API chính

- POST `/api/auth/login`
- GET `/api/products`
- POST `/api/orders`
- GET `/api/admin/statistics`
- GET `/api/admin/revenue`

---

## ✔ 5. Chức năng backend cung cấp

- Đăng nhập / đăng ký
- Lưu token JWT
- Lấy danh sách sản phẩm
- Tạo đơn hàng
- Quản lý trạng thái đơn (Admin)
- Trang thống kê và doanh thu (Admin)

---

## © 2025 – TechNest Backend
