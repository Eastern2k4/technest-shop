# TechNest Shop

TechNest Shop la monorepo cho mot ung dung e-commerce gom:

- `frontend/technest-app`: React + Vite
- `backend/ecommerce`: Spring Boot + Spring Security + JPA
- `database`: MySQL 8.4

README nay la tai lieu public de nguoi khac co the hieu project, cai dat, va chay project tren may cua ho.

## Chuc Nang Chinh

- Xem danh muc, tim kiem, loc san pham theo category, gia, brand
- Dang ky, dang nhap, xem va cap nhat ho so nguoi dung
- Gio hang luu theo guest/user va dong bo theo user
- Dat hang, theo doi lich su don, xac nhan da nhan hang
- Viet review sau khi don hang da giao va da thanh toan
- Staff co the xu ly don hang, cap nhat ton kho, duyet/xoa/reply review
- Admin co dashboard tong quan, quan ly san pham, user, don hang, va thong ke doanh thu

## Kien Truc Tong Quan

- Frontend goi backend qua API wrappers trong `frontend/technest-app/src/lib/api.ts`
- Backend theo kieu layered monolith: `controller`, `service`, `repository`, `dto`
- Authentication dung JWT bearer token
- Database schema duoc version hoa bang Flyway trong `backend/ecommerce/src/main/resources/db/migration`
- Local va deploy deu dung MySQL that
- Runtime duoc ep bang `APP_DATABASE_MODE=mysql`

## Yeu Cau Moi Truong

- Node.js 20+ va npm
- Java 17
- MySQL 8.4
- Docker + Docker Compose plugin neu muon chay full stack bang container

## Chay Local Voi MySQL

### 1. Clone repo va tao env

```bash
git clone <repo-url>
cd technest-shop
cp .env.example .env
```

Sua toi thieu trong `.env`:

- `MYSQL_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD` hoac `MYSQL_ROOT_PASSWORD`
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

Neu MySQL cua ban khong nam o `127.0.0.1:3306`, sua them `DB_URL`.

### 2. Tao database neu ban dung MySQL san co tren may

Neu khong chay bang Docker Compose, hay tao schema truoc:

```sql
CREATE DATABASE ecommerce_slim
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 3. Chay backend

```bash
cd backend/ecommerce
./mvnw spring-boot:run
```

Backend mac dinh chay tai `http://localhost:8080`.

### 4. Chay frontend

Mo terminal khac:

```bash
cd frontend/technest-app
npm install
npm run dev
```

Frontend mac dinh chay tai `http://localhost:5173`.

Frontend dev proxy `/api` ve `http://localhost:8080`.

## Chay Bang Docker Compose

Neu muon chay full stack gom `mysql`, `backend`, `frontend`:

```bash
docker compose up -d --build
```

Mac dinh frontend duoc publish tai `http://localhost`.

Kiem tra nhanh:

```bash
docker compose ps
curl http://localhost/actuator/health
curl 'http://localhost/api/products?cat=all'
```

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
npm run api:types
```

Preflight env truoc khi deploy:

```bash
./scripts/deploy-preflight.sh .env compose.yaml
```

## Tai Lieu Them

- `docs/API_CONTRACT.md`: tom tat contract API
- `docs/openapi.yaml`: OpenAPI source of truth
- `docs/DEPLOYMENT.md`: huong dan deploy chi tiet
- `.env.example`: bien moi truong mau

## Luu Y Bao Mat

- Khong commit `.env` that, password, token, API key, SSH key, hay runtime secret vao repo
- `.env.example` chi duoc chua placeholder an toan
- Deploy production phai thay `APP_CORS_ALLOWED_ORIGINS` bang domain that
