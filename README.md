# TechNest Shop Status

README nay la operating brief. Muc tieu la de lan sau chi can doc file nay la biet:

- project dang o trang thai nao
- contract va rule nao dang co hieu luc
- buoc tiep theo nen lam gi

Contract chi tiet da duoc tach ra:

- `docs/openapi.yaml`: source of truth dang may-doc duoc, co version
- `docs/API_CONTRACT.md`: human summary doc nhanh

## Snapshot

- Monorepo gom:
  - `frontend/technest-app`: React + Vite
  - `backend/ecommerce`: Spring Boot + Spring Security + JPA
- Runtime/deploy assets da co:
  - `compose.yaml`
  - `compose.prod.yaml`
  - `scripts/deploy-preflight.sh`
  - `scripts/wait-for-url.sh`
  - `scripts/smoke-public.sh`
  - `backend/ecommerce/Dockerfile`
  - `frontend/technest-app/Dockerfile`
  - `frontend/technest-app/nginx.conf`
  - `docs/DEPLOYMENT.md`
- Auth dung JWT bearer token; frontend luu auth state trong `localStorage` va da co guard khi parse loi.
- FE-BE contract chinh da duoc chuan hoa qua DTO/service cho `auth`, `profile`, `user`, `product`, `order`, `review`, `statistics`.
- OpenAPI spec versioned da co tai `docs/openapi.yaml`, frontend da co generated type artifact tai `frontend/technest-app/src/lib/api-contract.d.ts`, va API layer da duoc dua sang partial TypeScript (`src/lib/api.ts`, `src/lib/http.ts`).
- Frontend UI layer da bo raw `/api/...` string usage; cac screen chinh di qua domain wrappers trong `src/lib/api.ts` cho `auth`, `categories`, `products`, `orders`, `reviews`, `users`, `statistics`.
- Backend da dung Flyway baseline migration va `ddl-auto=validate`; khong con phu thuoc vao Hibernate auto-update de bootstrap schema.
- FE field-level validation da co o cac form chinh:
  - `SignIn`
  - `SignUp`
  - `Profile`
  - `AdminUsers`
  - `AdminProducts`
  - `Cart`
  - `StaffInventory`
- Controller nghiep vu lon da duoc day xuong service:
  - `OrderService`
  - `ReviewService`
  - `StatisticsService`
  - `UserService`
  - `AuthProfileService`
- Xac nhan ngay `2026-03-27`:
  - backend `./mvnw test`: pass `28/28`
  - frontend `npm run typecheck`: pass
  - frontend `npm run build`: pass
  - frontend `npm audit --include=dev`: `0 vulnerabilities`

## Current Contract

### User

- Shape chuan:
  - `id, email, username, fullName, phone, addressText, avatarUrl, role`

### Product

- Shape chuan:
  - `id, name, price, imageUrl, categoryId, categoryName, quantity, descriptionShort, descriptionLong`

### Order

- Summary/detail da duoc typed hoa.
- Field chinh:
  - `id, orderNumber, items, itemCount, subtotal, shipping, total, paymentMethod, status, paymentStatus, placedAt`

### Review

- Public product reviews chi tra review da duyet.
- Staff/admin co management list rieng cho moi product.
- Review response dung:
  - `id, userId, userName, userAvatar, rating, title, body, isApproved, createdAt, reply`
- Pending counters da chuan hoa thanh:
  - `pendingReviews`
- Review moi duoc tao o trang thai `pending`.
- Reply chi duoc phep khi review da `approved`.
- Moi review chi co `1` reply; goi reply lan sau se update.

### Error Response

- API loi da duoc chuan hoa ve:
  - `status, error, message, validationErrors`
- FE cac form chinh da bat dau consume `validationErrors` theo field.

## Known Decisions

### Order

- Tao don hang dung `pessimistic write lock` tren product de giam oversell.
- Da co concurrency test cho case 2 request tranh chap 1 ton kho cuoi cung.
- Xoa user khong bulk delete order nua; xoa qua entity de cascade xuong `order_items`.

### Review Moderation

- Review moi khong auto approve nua.
- Staff/admin co the:
  - duyet review
  - dua review ve `pending`
  - xoa review
  - reply/cap nhat reply sau khi review da duyet
- Staff UI `/staff/reviews` da dong bo voi luong moderation moi.
- Staff dashboard da doi semantics tu `pendingReplies` sang `pendingReviews`.

### Validation and Errors

- Request DTO chinh da co bean validation + `@Valid`.
- Validation payload tra ve `validationErrors` thay vi loi string roi rac.
- FE da co `FieldError` component dung chung.
- Checkout va staff inventory da dung chung co che field-level validation thay vi `alert()`/generic error.
- Admin/staff order va delete flows da bo `alert()` va chuyen sang error banner/notice.

### Security and Runtime

- `401/403` tra JSON co cau truc thay vi plain text.
- Email auth/admin duoc normalize ve lowercase va lookup theo ignore-case de tranh mismatch hoa-thuong.
- JWT TTL da chuyen sang config `app.jwt.ttl-seconds` thay vi hard-code trong controller.
- JWT secret fail-fast neu ngan hon 32 ky tu.
- `JwtAuthFilter` khong ghi de auth context neu da co auth.
- Security headers mac dinh da bat cho API:
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cache-Control`
- Actuator chi public `health`.
- CORS da doc tu env, khong cho phep `*` khi credentials dang bat, `spring.jpa.open-in-view=false`, va 500 da khong leak stack trace/class name.

### Deployment

- Backend va frontend da co Dockerfile rieng; stack local/prod co the chay qua `docker compose`.
- Frontend Nginx phuc vu static build va proxy same-origin `/api/*` sang backend.
- Schema duoc version hoa bang Flyway tai `backend/ecommerce/src/main/resources/db/migration`.
- `SPRING_JPA_HIBERNATE_DDL_AUTO` mac dinh deploy da ve `validate`.
- App bootstrap tu dam bao role `customer/staff/admin`, va co the tao admin dau tien qua env.
- Da co 2 path:
  - source build qua `compose.yaml`
  - image release qua `compose.prod.yaml`
- Repo da co GitHub workflow cho:
  - CI verify
  - release image len GHCR
  - deploy qua SSH neu da cau hinh secret
- Release path da co them preflight, retryable health wait, va optional public smoke sau deploy.
- Chi tiet runtime/deploy xem `docs/DEPLOYMENT.md`.

### Query Strategy

- Admin orders, statistics, users, product filtering da giam fetch `findAll()` roi loc trong memory.
- Product filtering da day xuong repository/specification.
- Flyway da co them migration index cho hotspot query cua:
  - admin orders / statistics
  - review moderation
  - product category + price filters

## Open Risks

1. Chua smoke-test duoc `docker compose up` ngay trong workspace nay vi may hien tai khong co `docker` binary.
2. Production auth hardening muc cao chua xong:
   - refresh/revocation strategy
   - final cookie strategy neu can muc bao mat cao hon
   - policy ratelimit/risk-based auth day du
3. Search theo `q/brand` van dua tren `%like%` tren `product.name`; neu data lon hon nua se can full-text/search service chuyen biet.
4. Can chot backup/restore, monitoring, va wire deploy secret/host that truoc khi go-live that.
5. FE da di qua domain wrappers typed o API layer, nhung page/component van la JSX; chua co typed client xuyen suot den UI state/forms.

## Next Step

1. Cau hinh GitHub secret + host that, chay `Release` workflow, va smoke deploy tren VPS/host co Docker that.
2. Bat TLS o edge va chay go-live checklist trong `docs/DEPLOYMENT.md`.
3. Can nhac mo rong TypeScript tu wrapper layer ra cac screen/form quan trong, hoac generate typed client day du tu `docs/openapi.yaml`.
4. Danh gia tiep search strategy cho `q/brand` neu catalog lon hon, vi B-Tree index khong giai quyet tot leading wildcard search.
5. Hoan thien production auth strategy neu app co user that.

## Last Completed Change

### 2026-03-27

- Them deployment assets cho internet-facing stack:
  - `compose.yaml`
  - backend/frontend Dockerfile
  - frontend Nginx proxy same-origin
  - `.env.example`
  - `docs/DEPLOYMENT.md`
- Them `BootstrapDataService` de dam bao role core va bootstrap admin qua env.
- Chuyen schema bootstrap tu Hibernate sang Flyway:
  - them `V1__baseline.sql`
  - doi `ddl-auto` sang `validate`
  - doi default deploy env sang `validate`
- Them CI/CD GitHub:
  - `ci.yml` cho backend tests, frontend build, docker image build
  - `release.yml` cho build/push GHCR va deploy qua SSH
- Them `compose.prod.yaml` de tach image-based deploy khoi source-build deploy.
- Them `V2__query_indexes.sql` cho query hotspot:
  - orders theo `user_id + placed_at`
  - statistics/admin list theo `status + payment_status + placed_at`
  - product filter theo `category_id + price`
  - review moderation theo `product_id + created_at` va `is_approved + created_at`
- Them `docs/openapi.yaml` version `1.0.0` cho contract auth/catalog/order/review/admin/statistics.
- Them `redocly.yaml` va noi `ci.yml` vao OpenAPI lint de spec duoc verify trong CI.
- Them `frontend/technest-app/src/lib/api-contract.d.ts` va script `npm run api:types` de sinh type artifact tu OpenAPI.
- Them `frontend/technest-app/src/lib/api.ts`, `src/lib/http.ts`, `tsconfig.typecheck.json`, va `npm run typecheck` de OpenAPI types bat dau rang buoc runtime API layer that su.
- Dung `isAuthenticatedProfile` trong `SignIn`, `SignUp`, `Profile` de bo gia dinh ngam sai ve shape cua `/api/auth/me`.
- Nang `react-router-dom` len ban patched va nang frontend toolchain len `vite@8` + `@vitejs/plugin-react@6`; `npm audit --include=dev` hien tai ve `0 vulnerabilities`.
- Mo rong `src/lib/api.ts` thanh domain wrappers cho `categories/products/orders/reviews/users/statistics`.
- Chuyen customer flows, admin/staff screens, va chatbot sang domain wrappers; frontend da khong con raw `/api/...` string usage trong `src/`.
- Them script deploy/preflight/smoke cho host that:
  - `scripts/deploy-preflight.sh`
  - `scripts/wait-for-url.sh`
  - `scripts/smoke-public.sh`
- Them image-level `HEALTHCHECK` cho backend/frontend Dockerfile, va nang frontend Docker build len `npm ci --include=dev` de tranh mat devDependencies khi build image.
- Nang release workflow len remote preflight + retryable health wait; neu co `DEPLOY_BASE_URL` se chay them public smoke.
- Them verify shell/preflight vao CI.
- Xac nhan lai sau nhiep nay:
  - frontend `npm run typecheck`: pass
  - frontend `npm run build`: pass
