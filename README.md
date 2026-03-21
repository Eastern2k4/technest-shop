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

## Executive Snapshot

### Kien truc hien tai

- Monorepo gom React/Vite frontend va Spring Boot backend.
- Auth dung JWT bearer token, FE luu token trong `localStorage`.
- Admin/staff/customer da co phan quyen co ban.
- Backend da bat dau tach `service + DTO` cho `order`, `review`, `statistics`.
- `UserController` va mot phan `AuthController` van con business logic/validation nam trong controller.

### Trang thai da xac nhan

- Backend `./mvnw test` pass.
- Frontend `npm run build` pass.
- Luong dat hang da duoc bo sung khoa ghi tren product de giam oversell trong giao dich cung DB.
- Luong reply review da duoc siet lai theo rule 1 review chi co 1 reply; goi lai se la update.
- Xoa user da chuyen sang xoa order qua entity cascade thay vi bulk delete thang.
- Auth bootstrap FE da an toan hon khi `localStorage` chua JSON hong.
- `OrderController` da day logic tao don sang `OrderService`.
- `ReviewController` da day logic review/reply sang `ReviewService`.
- `StatisticsController` da day logic dashboard/revenue sang `StatisticsService`.
- Product contract da duoc chuan hoa ve 1 shape duy nhat:
  - `id, name, price, imageUrl, categoryId, categoryName, quantity, descriptionShort, descriptionLong`
- Auth/profile contract da duoc chuan hoa ve:
  - `id, email, username, fullName, phone, addressText, avatarUrl, role`
- Order summary/detail da bo sung `itemCount` tu backend de FE khong can map tam.
- Review/statistics contract da duoc typed hoa, khong con tra `Map<String,Object>` cho cac endpoint chinh.

### Van de lon con mo

1. FE va BE chua co API contract on dinh theo DTO/schema versioned.
2. `UserController` va `AuthController.updateProfile` van chua tach service/request validation typed day du.
3. Test coverage van con mong o review, admin, product filtering, va security edge cases.
4. CORS, logging, va error response van chua dat muc production-ready.
5. README con la single source of truth tam thoi; code chua tu mo ta duoc qua contract/test du manh.

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
- Review/statistics/order da chuyen sang DTO typed on dinh thay vi `Map` dong.
- Business logic tao order/review/revenue khong con nam thang trong controller.
- Da them check stock, tru stock, transaction co ban va pessimistic lock khi tao don hang.
- Da siet lai quyen update order status/payment status cho admin/staff/customer.
- Luong reply review da duoc doi thanh upsert de tranh duplicate reply.
- Luong delete user da tranh bulk delete de giam rui ro vo FK voi `order_items`.
- Auth va admin user response da chuyen sang DTO typed thay vi `Map` dong.
- Order response da them `itemCount` va chuan hoa summary/detail shape.
- `AuthController.me` khi chua login da chuyen sang response typed `authenticated=false`.
- Review request/response da co record typed cho create/reply/list/pending-count.
- Statistics dashboard/revenue da co record typed cho summary va chart series.

### Frontend

- Da gom page-level API calls ve `src/lib/api.js`
- Da bo `AuthProvider` long nhau
- Auth parsing / login / register / me da giam duplicate, profile update khong con can goi `login()` de ghi de auth state
- Mot so page admin dang tu map status khong khop enum backend
- Auth bootstrap da them guard khi parse `localStorage`
- Da bo alias `product.image`, `product.specs`, `user.name` o cac man hinh chinh; FE gio doc contract chuan.

### FE-BE integration

- Chua co "single source of truth" cho API contract
- DTO/response shape chua duoc chuan hoa
- Revenue export frontend da dung thang backend endpoint
- CORS moi allow localhost 5173/3000, chua co cau hinh moi truong ro rang

## Priority Backlog

### P0

1. Tach `UserController` va `AuthController.updateProfile` sang service + request DTO typed
2. Viet them integration test cho order concurrency
3. Giam log noisey va dong leak thong tin noi bo trong error response
4. Chuan hoa CORS/config theo env thay vi hard-code localhost
5. Bo debug log thua trong auth/JWT/profile flow

### P1

1. Chuan hoa auth contract FE-BE
2. Chuan hoa review schema va moderation flow
3. Chuan hoa admin/staff screen con lai theo contract backend that
4. Them validation co cau truc cho request payload
5. Bo `open-in-view`, giam `findAll()` tren cac man admin/revenue/order

### P2

1. Tach controller/service/DTO ro hon
2. Them integration tests cho auth/order/admin
3. Chuan hoa naming, structure, response schema
4. Don dep `database/`, `test/`, `.venv/`, file tam

## Working Rules

- Moi thay doi code xong phai cap nhat file nay ngay.
- Moi khi bat dau buoc moi, doc `Executive Snapshot`, `Priority Backlog`, `Known Decisions`, `Next Step`.
- Khong can quet lai toan repo neu thay doi nam trong backlog da mo ta ro o day, tru khi README mat dong bo voi code.
- Uu tien blocker build/runtime/data-integrity/security truoc, sau do moi den refactor.

## Known Decisions

### Order

- Stock lookup da chuyen sang `pessimistic write lock` tai repository.
- Muc tieu ngan han: chong oversell tren cung 1 DB transaction.
- Logic tao don va mapping response da chuyen vao `OrderService`.
- Chua giai quyet:
  - concurrency test thuc su
  - retry/timeout strategy khi lock tranh chap
  - toi uu filter/query de tranh `findAll()` o man admin

### Review

- Rule hien tai: moi review chi co 1 reply.
- Endpoint reply la upsert: neu review da co reply thi update noi dung/staffId.
- `pending-count` phai dem theo review da duoc reply, khong dem theo so ban ghi reply.
- List/create/reply/pending count da di qua `ReviewService` va DTO typed.
- Chua giai quyet:
  - validation rating/body/title
  - moderation workflow that, hien dang auto approve
  - test day du cho conflict/permission

### User delete

- Khong dung bulk `deleteByUserId` de xoa order nua.
- Rule hien tai: fetch orders cua user va xoa qua entity de cascade xuong `order_items`.
- Chua giai quyet:
  - benchmark voi user co rat nhieu order
  - delete strategy neu sau nay co them bang lien quan invoice/payment/shipment

### Frontend auth storage

- `AuthContext` phai coi `localStorage` la input khong tin cay.
- Neu parse fail thi clear state thay vi crash app.
- `/api/auth/me` khi chua dang nhap tra ve response typed `authenticated=false`.
- Chua giai quyet:
  - migrate sang cookie/httpOnly neu can muc bao mat cao hon
  - central refresh/logout strategy cho token het han
  - tach `updateProfile` sang service + request DTO thay vi `Map`

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
- Hoan thanh buoc 9:
  - Sua review principal finding trong review toan repo:
    - `OrderController` dung `ProductRepository.findByIdForUpdate(...)` de khoa ban ghi product khi tru stock
    - `ReviewController` doi reply sang upsert, khong tao duplicate `review_id`
    - `pending-count` dem distinct review reply
    - `UserController.deleteUser` xoa order qua entity cascade thay vi bulk delete
    - `AuthContext` them guard khi `localStorage` hong JSON
  - Them integration tests cho:
    - reply review lan 2 phai update reply cu
    - admin xoa user da co order van thanh cong
  - Xac nhan `mvn test` pass voi 8 tests, 0 failures
  - Xac nhan frontend van build thanh cong bang `npm run build`
- Hoan thanh buoc 10:
  - Chuan hoa contract FE-BE cho `product`, `auth profile`, `admin user`, `order`
  - Loai bo alias:
    - product: `image`, `specs`
    - auth user: `name`
    - staff orders: `grandTotal` map tam tu `total`
  - Backend bo sung DTO typed cho auth/admin user va response order co `itemCount`
  - Frontend da doi cac page public/admin/staff sang doc contract chuan
  - Xac nhan backend test pass va frontend build pass
- Hoan thanh buoc 11:
  - Tach `OrderService`, `ReviewService`, `StatisticsService` de giam controller-heavy
  - Tao DTO typed rieng cho:
    - order request/response/status update
    - review create/reply/list/pending count
    - statistics summary/revenue series
  - `ReviewController` va `StatisticsController` khong con tra `Map<String,Object>`
  - `OrderController` khong con giu logic tao don hang trong controller
  - `AuthController.me` khi anonymous da tra response typed thay vi `Map.of(...)`
  - Xac nhan `mvn test` pass voi 8 tests, 0 failures
  - Xac nhan frontend van build thanh cong bang `npm run build`

## Next Step

Buoc nen lam tiep:

1. Tach `UserController` va `AuthController.updateProfile` sang service + request DTO ro rang.
2. Them test concurrency cho create order, it nhat cover 2 request tranh chap cung 1 product.
3. Rut gon `GlobalExceptionHandler` va log security/JWT de tranh leak stack trace/noise.
4. Chuan hoa CORS theo env va bo `spring.jpa.open-in-view`.
5. Xem lai worktree:
   - hien co file bi xoa trong git status:
     - `backend/ecommerce/README.md`
     - `frontend/technest-app/README.md`
   - can quyet dinh giu xoa hay phuc hoi de tranh de worktree mo lau.
