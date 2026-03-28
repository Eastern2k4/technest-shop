# TechNest Shop

TechNest Shop la monorepo cho mot ung dung e-commerce gom:

- `frontend/technest-app`: React + Vite
- `backend/ecommerce`: Spring Boot + Spring Security + JPA
- `database`: MySQL 8.4 hoac H2 local mode

Project ho tro catalog san pham, gio hang, dat hang, quan ly user, review moderation, thong ke doanh thu, va deploy bang Docker Compose.

`help.md` giu vai tro operating brief noi bo. File nay la README huong dan tong quan va cach su dung.

## Chuc Nang Chinh

- Xem danh muc, tim kiem, loc san pham theo category, gia, brand
- Dang ky, dang nhap, xem va cap nhat ho so nguoi dung
- Gio hang luu theo guest/user va dong bo theo user
- Dat hang, theo doi lich su don, xac nhan da nhan hang
- Viet review sau khi don hang da giao va da thanh toan
- Staff:
  - xu ly don hang
  - cap nhat ton kho
  - duyet/xoa/reply review
- Admin:
  - dashboard tong quan
  - quan ly san pham
  - quan ly user
  - xem don hang
  - xem thong ke va export doanh thu
- OpenAPI contract, migration bang Flyway, va deploy bang Docker

## Kien Truc Tong Quan

- Frontend goi backend qua API wrappers trong `frontend/technest-app/src/lib/api.ts`
- Backend theo kieu layered monolith:
  - `controller`
  - `service`
  - `repository`
  - `dto`
- Authentication dung JWT bearer token
- Database schema duoc version hoa bang Flyway trong `backend/ecommerce/src/main/resources/db/migration`
- Local backend co `auto` mode:
  - co MySQL credentials hop le thi dung MySQL
  - khong co thi tu boot H2 seeded de giao dien co du lieu ngay

## Yeu Cau Moi Truong

- Node.js 20+ va npm
- Java 17
- Maven Wrapper co san trong repo, khong can cai Maven rieng
- Tuy chon:
  - MySQL 8.4 neu muon dung du lieu that
  - Docker + Docker Compose neu muon chay full stack bang container

## Cai Dat Nhanh

### 1. Clone repo va tao env

```bash
cp .env.example .env
```

Can sua toi thieu neu muon dung MySQL/deploy:

- `MYSQL_ROOT_PASSWORD`
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

### 2. Cai frontend dependencies

```bash
cd frontend/technest-app
npm install
```

## Chay Local

### Cach 1: Chay nhanh voi H2 seeded

Backend:

```bash
cd backend/ecommerce
SPRING_PROFILES_ACTIVE=h2 ./mvnw spring-boot:run
```

Frontend:

```bash
cd frontend/technest-app
npm run dev
```

Mac dinh:

- Backend: `http://localhost:8080`
- Frontend: `http://localhost:5173`

### Cach 2: Chay voi MySQL local

Dam bao `.env` da co:

- `MYSQL_DATABASE`
- `MYSQL_ROOT_PASSWORD`

Sau do chay:

```bash
cd backend/ecommerce
./mvnw spring-boot:run
```

Backend se tu vao `auto` mode va uu tien MySQL neu credentials hop le.

### Cach 3: Chay bang Docker Compose

```bash
docker compose up -d --build
```

Mac dinh frontend se mo o cong `80`:

- `http://localhost`

## Tai Khoan Demo Local H2

Neu chay voi H2 seeded, ban co the dang nhap bang:

- `customer@technest.local / TechNest@123`
- `staff@technest.local / TechNest@123`
- `admin@technest.local / TechNest@123`

## Huong Dan Su Dung

### Nguoi Dung

1. Mo trang chu, xem catalog hoac tim kiem san pham
2. Them san pham vao gio hang
3. Dang ky hoac dang nhap
4. Dat hang tu trang `Cart`
5. Xem lich su don va cap nhat ho so o trang `Profile`
6. Sau khi don o trang thai `DELIVERED` va `PAID`, co the viet review

### Staff

1. Dang nhap bang tai khoan role `STAFF`
2. Vao `/staff`
3. Xu ly don hang o `Process Orders`
4. Quan ly ton kho o `Inventory`
5. Duyet va phan hoi review o `Reviews`

### Admin

1. Dang nhap bang tai khoan role `ADMIN`
2. Vao `/admin`
3. Theo doi KPI o dashboard
4. Quan ly san pham, don hang, user
5. Xem va export doanh thu

## Lenh Huu Ich

Backend:

```bash
cd backend/ecommerce
./mvnw test
```

Frontend:

```bash
cd frontend/technest-app
npm run typecheck
npm run build
```

Sinh lai API types tu OpenAPI:

```bash
cd frontend/technest-app
npm run api:types
```

## Tai Lieu Them

- `help.md`: operating brief va trang thai project
- `docs/API_CONTRACT.md`: tom tat contract API
- `docs/openapi.yaml`: OpenAPI source of truth
- `docs/DEPLOYMENT.md`: huong dan deploy chi tiet
- `.env.example`: bien moi truong mau

## Ghi Chu

- Frontend mac dinh proxy `/api` ve `http://localhost:8080` khi chay dev
- Deploy production uu tien dung same-origin `/api` qua Nginx
- Schema database duoc quan ly bang Flyway, khong dung Hibernate auto-update de bootstrap schema production
