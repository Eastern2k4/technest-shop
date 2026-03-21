# TechNest Shop Project Status

## Overview

Monorepo hien tai gom:

- `frontend/technest-app`: React + Vite frontend
- `backend/ecommerce`: Spring Boot backend
- `database`: thu muc phu tro, hien co file test/artefact

Muc tieu cua file nay:

- Ghi lai trang thai thuc te cua project
- Theo doi cac loi kien truc, loi runtime, mismatch FE-BE
- Ghi backlog uu tien sua
- Ghi nhat ky cac thay doi da thuc hien

## Current Status

### Da co

- Frontend Vite co cac man hinh public, auth, cart, profile, admin, staff
- Backend Spring Boot co auth, product, category, order, review, statistics, user management
- JWT auth da ton tai
- Admin va staff area da co route rieng

### Van de lon dang ton tai

1. FE va BE van chua chuan hoa API contract day du.
2. Repo van con test artefact, file tam va config nhay cam commit truc tiep.
3. Test coverage van con thap, nhung backend da co integration test co nghiep vu cho auth/order.
4. Order lifecycle da duoc siet lai co ban, nhung van chua co integration test theo nghiep vu va chua tach service rieng.
5. FE-BE van con nhieu response dang dung `Map<String,Object>` thay vi DTO/schema ro rang.

## Key Findings

### Backend

- Backend da build duoc lai.
- `application.properties` da chuyen sang env-driven config, khong con hard-code password/JWT secret that.
- Backend test da chay that bang H2 thay vi `skipTests=true`.
- Da co integration test cho:
  - register + me
  - create order success
  - create order insufficient stock
  - customer delivered flow
  - staff shipping/payment update
- Controller tra ve nhieu `Map<String,Object>` thay vi DTO on dinh.
- Business logic order nam thang trong controller.
- Da them check stock, tru stock va transaction co ban khi tao don hang.
- Da siet lai quyen update order status/payment status cho admin/staff/customer.

### Frontend

- Da gom page-level API calls ve `src/lib/api.js`
- Da bo `AuthProvider` long nhau
- Auth parsing / login / register / me da giam duplicate, profile update khong con can goi `login()` de ghi de auth state
- Mot so page admin dang tu map status khong khop enum backend

### FE-BE integration

- Chua co "single source of truth" cho API contract
- DTO/response shape chua duoc chuan hoa
- Revenue export frontend da dung thang backend endpoint
- CORS moi allow localhost 5173/3000, chua co cau hinh moi truong ro rang

## Priority Backlog

### P0

1. Lam backend build duoc
2. Don file rac va artefact khoi source tree
3. Tao root README theo doi project
4. Chuan hoa base URL va HTTP client phia frontend
5. Bo duplicate `AuthProvider`

### P1

1. Chuan hoa auth contract FE-BE
2. Chuan hoa order lifecycle va quyen update status
3. Check stock va tru stock khi dat hang
4. Dung backend export endpoint cho revenue
5. Tach secrets khoi source code

### P2

1. Tach controller/service/DTO ro hon
2. Them integration tests cho auth/order/admin
3. Chuan hoa naming, structure, response schema
4. Don dep `database/`, `test/`, `.venv/`, file tam

## Working Rules

- Moi thay doi code xong phai review lai toan bo code cua he thong, kiem tra tinh mapping roi cap nhat file nay
- Moi khi bat dau mot buoc moi, doc nhanh file nay truoc
- Uu tien sua blocker build/runtime truoc, sau do moi den refactor

## Change Log

### 2026-03-21

- Tao root `README.md` de theo doi tinh trang project
- Ghi nhan danh gia tong quan FE, BE va integration
- Hoan thanh buoc 1:
  - Xoa file Java rac `backend/ecommerce/src/main/java/com/example/ecommerce/controller/interface A{.java`
  - Xac nhan backend build thanh cong lai bang `mvn test`
  - Luu y: Maven van dang `skipTests=true`, nen build xanh nhung test chua duoc chay
- Hoan thanh buoc 2:
  - Bo `AuthProvider` long nhau trong frontend
  - Auth state gio chi con 1 provider tai `src/main.jsx`
  - Xac nhan frontend van build thanh cong bang `npm run build`
- Hoan thanh buoc 3:
  - Chuan hoa API base URL ve `VITE_API_URL` hoac same-origin thay vi hard-code `localhost:4000`
  - Gom page-level API calls ve `src/lib/api.js`
  - Chuyen `Home`, `Search`, `SignIn`, `SignUp`, `OrderSuccess` sang dung API client chung
  - Sua `AuthAPI.register` de dung field `fullName`
  - Xac nhan frontend van build thanh cong bang `npm run build`
- Hoan thanh buoc 4:
  - Them helper `toAuthUser` va `AuthAPI.me` de signin/signup/profile dung cung auth contract
  - Them `setAuthUser` vao auth context de update user state ma khong redirect
  - Sua bug profile update dang goi `login()` gay redirect ngoai y muon
  - Xac nhan frontend van build thanh cong bang `npm run build`
- Hoan thanh buoc 5:
  - Them transaction, validate payload, check stock va tru stock trong order creation
  - Chuan hoa response helper cho order create/update
  - Sua quyen update status/payment status:
    - admin/staff co the quan ly order va payment
    - customer chi duoc tu danh dau `DELIVERED` cho don cua minh khi don dang `SHIPPING`
  - Sua mapping FE dashboard de `DELIVERED` hien thi dung badge thanh cong
  - Xac nhan backend build thanh cong bang `mvn test`
  - Xac nhan frontend build thanh cong bang `npm run build`
- Hoan thanh buoc 6:
  - Loai bo duplicate logic revenue export o frontend
  - Chuyen admin revenue export sang dung backend endpoint `/api/admin/revenue/export`
  - Xac nhan frontend van build thanh cong bang `npm run build`
- Hoan thanh buoc 7:
  - Chuyen backend config sang env-driven:
    - DB URL, username, password
    - JWT secret
    - mail config
    - security log level
  - Bo sung `.gitignore` de an `database/.venv`, `backend/ecommerce/test/`, `database/test.py`
  - Them H2 test dependency va test application config rieng
  - Bo `skipTests=true` trong Maven
  - Xac nhan `mvn test` da chay test that va pass
  - Xac nhan frontend van build thanh cong bang `npm run build`
- Hoan thanh buoc 8:
  - Them integration test bang MockMvc cho auth/order
  - Cover cac flow:
    - register + me
    - create order success
    - create order fail when stock is insufficient
    - customer mark delivered
    - staff update shipping/payment status
  - Xac nhan `mvn test` pass voi 6 tests, 0 failures

## Next Step

Buoc dang lam:

- Don dep repo va giam rui ro van hanh:
  - tiep tuc tach DTO/schema ro rang
  - xem lai cac thay doi worktree khong phai do Codex tao
  - tiep tuc mo rong test cho admin/user/review
