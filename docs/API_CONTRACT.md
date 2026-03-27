# API Contract

`docs/openapi.yaml` la source of truth dang may-doc duoc va da co version.
File markdown nay giu vai tro human summary de doc nhanh.

Tai lieu nay la contract thuc dung hien tai giua FE va BE. README chi giu snapshot; file nay giu shape va endpoint chinh.

## Error Envelope

Tat ca loi API nen theo format:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "validationErrors": {
    "fieldName": "Error message"
  }
}
```

`validationErrors` chi co khi loi la payload/constraint validation.

## Canonical Shapes

### User Profile / Auth User

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "user@example.com",
  "fullName": "User Name",
  "phone": "0909...",
  "addressText": "123 Street",
  "avatarUrl": "https://...",
  "role": "customer"
}
```

FE auth state da normalize role ve uppercase khi dua vao context:

```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "user@example.com",
  "fullName": "User Name",
  "phone": "0909...",
  "addressText": "123 Street",
  "avatarUrl": "https://...",
  "role": "CUSTOMER",
  "accessToken": "jwt"
}
```

### Product

```json
{
  "id": 10,
  "name": "Laptop",
  "price": 22000000,
  "imageUrl": "https://...",
  "categoryId": 2,
  "categoryName": "Laptop",
  "quantity": 8,
  "descriptionShort": "Short text",
  "descriptionLong": "Long text"
}
```

### Order Summary

```json
{
  "id": 55,
  "orderNumber": "ORD-...",
  "customerName": "Customer One",
  "customerEmail": "customer@example.com",
  "itemCount": 2,
  "subtotal": 1000000,
  "shipping": 30000,
  "total": 1030000,
  "paymentMethod": "cod",
  "status": "PENDING",
  "paymentStatus": "UNPAID",
  "placedAt": "2026-03-23T..."
}
```

### Order Detail

```json
{
  "id": 55,
  "orderNumber": "ORD-...",
  "customerName": "Customer One",
  "customerEmail": "customer@example.com",
  "itemCount": 2,
  "items": [
    { "id": 10, "name": "Laptop", "qty": 1, "price": 22000000 }
  ],
  "subtotal": 22000000,
  "shipping": 30000,
  "total": 22030000,
  "paymentMethod": "cod",
  "status": "PENDING",
  "paymentStatus": "UNPAID",
  "placedAt": "2026-03-23T..."
}
```

### Review Response

```json
{
  "id": 99,
  "userId": 1,
  "userName": "Customer One",
  "userAvatar": "https://...",
  "rating": 5,
  "title": "Great",
  "body": "Works well",
  "isApproved": true,
  "createdAt": "2026-03-23T...",
  "reply": {
    "id": 7,
    "staffId": 3,
    "body": "Thanks for your feedback"
  }
}
```

### Review Counters

```json
{ "pendingReviews": 3 }
```

```json
[
  { "productId": 10, "pendingReviews": 2 },
  { "productId": 11, "pendingReviews": 1 }
]
```

## Endpoint Summary

### Auth

- `POST /api/auth/register`
  Request: `{ fullName, email, password }`
  Response: `{ token }`
- `POST /api/auth/login`
  Request: `{ email, password }`
  Response: `{ token }`
- `GET /api/auth/me`
  Auth required.
  Response khi authenticated: `UserProfileResponse`
  Response khi chua login: `{ authenticated: false }`
- `PUT /api/auth/me`
  Auth required.
  Request: `{ fullName, username, phone, addressText, avatarUrl, newPassword }`
  Response: `UserProfileResponse` + `message`

### Products and Categories

- `GET /api/products`
  Public. Support q/category/brand/minPrice/maxPrice filters.
- `GET /api/products/{id}`
  Public.
- `POST /api/products`
  Staff/Admin.
  Request body theo `ProductDTO`.
- `PUT /api/products/{id}`
  Staff/Admin.
  Request body theo `ProductDTO`.
- `DELETE /api/products/{id}`
  Admin.
- `GET /api/categories`
  Public.
- `POST /api/categories`
  Staff/Admin.
- `PUT /api/categories/{id}`
  Staff/Admin.
- `DELETE /api/categories/{id}`
  Admin.

### Orders

- `POST /api/orders`
  Customer only.
  Request:
  ```json
  {
    "items": [{ "id": 10, "qty": 1 }],
    "address": ["Full Name", "Phone", "Address", "City", "District"],
    "payment": "cod"
  }
  ```
- `GET /api/orders/me`
  Authenticated user.
- `GET /api/orders`
  Staff/Admin.
- `GET /api/orders/{id}`
  Authenticated owner or staff/admin.
- `PUT /api/orders/{id}/status`
  Authenticated.
  Controller/service se enforce permission theo role va order ownership.
  Request:
  ```json
  { "status": "SHIPPING" }
  ```
  hoac
  ```json
  { "paymentStatus": "PAID" }
  ```

### Reviews

- `GET /api/reviews/product/{productId}`
  Public.
  Chi tra review da `approved`.
- `POST /api/reviews/product/{productId}`
  Auth required.
  Customer chi review duoc san pham da mua `DELIVERED + PAID`.
  Request: `{ rating, title, body }`
  Review moi mac dinh `pending approval`.
- `GET /api/reviews/pending-count`
  Staff/Admin.
- `GET /api/reviews/pending-by-product`
  Staff/Admin.
- `GET /api/reviews/manage/product/{productId}`
  Staff/Admin.
  Tra ca approved va pending review.
- `PUT /api/reviews/{reviewId}/moderation`
  Staff/Admin.
  Request: `{ approved: true|false }`
- `POST /api/reviews/{reviewId}/reply`
  Staff/Admin.
  Request: `{ body }`
  Chi cho phep khi review da approved.
  Moi review chi co 1 reply, goi lai la update.
- `DELETE /api/reviews/{reviewId}`
  Staff/Admin.

### Admin Users

- `GET /api/admin/users`
  Admin.
- `GET /api/admin/users/{id}`
  Admin.
- `POST /api/admin/users`
  Admin.
  Request:
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "secret123",
    "fullName": "User Name",
    "phone": "0909...",
    "addressText": "123 Street",
    "role": "staff"
  }
  ```
- `PUT /api/admin/users/{id}`
  Admin.
- `DELETE /api/admin/users/{id}`
  Admin.

## Runtime Decisions That Affect FE

- Email auth/admin writes duoc normalize lowercase.
- Login rate limit dang bat o backend theo property:
  - `app.auth.rate-limit.max-attempts`
  - `app.auth.rate-limit.block-seconds`
- JWT TTL dang doc tu:
  - `app.jwt.ttl-seconds`
- API response co security headers mac dinh:
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Cache-Control`
