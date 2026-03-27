# Deployment Guide

Muc tieu cua file nay la dua project len internet that voi stack don gian:

- `frontend`: React build + Nginx
- `backend`: Spring Boot
- `mysql`: MySQL 8.4
- `release path`: GHCR images + GitHub Actions deploy workflow

Toan bo co the chay bang `docker compose`, theo 2 mode:

- `compose.yaml`: build image tu source tai local/server
- `compose.prod.yaml`: dung image da push len registry

## 1. Chuan bi server

Toi thieu:

- Ubuntu/Debian VPS
- Docker Engine + Docker Compose plugin
- Domain da tro ve IP cua server

Khuyen nghi:

- dung reverse proxy hoac LB co TLS o phia ngoai container
- chi mo cong `80/443`
- khong expose MySQL va backend port ra internet cong khai
- truoc moi lan deploy, chay preflight script de bat loi env/compose som

## 2. Tao env

Copy file mau:

```bash
cp .env.example .env
```

Bat buoc sua:

- `MYSQL_ROOT_PASSWORD`
- `APP_JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`

Neu muon app tu tao admin dau tien:

- `APP_BOOTSTRAP_ADMIN_EMAIL`
- `APP_BOOTSTRAP_ADMIN_PASSWORD`
- `APP_BOOTSTRAP_ADMIN_FULL_NAME`

Khuyen nghi:

- sau lan boot dau tien, dang nhap admin, doi mat khau neu can
- neu khong muon moi lan restart deu force password theo env, co the xoa `APP_BOOTSTRAP_ADMIN_PASSWORD` khoi `.env` sau khi da bootstrap xong

Preflight:

```bash
./scripts/deploy-preflight.sh .env compose.yaml
```

Neu dung image-based release:

```bash
export BACKEND_IMAGE=ghcr.io/your-org/technest-backend:v1.0.0
export FRONTEND_IMAGE=ghcr.io/your-org/technest-frontend:v1.0.0
./scripts/deploy-preflight.sh .env compose.prod.yaml
```

## 3. Chay stack

### Cach 1: build tu source

```bash
docker compose up -d --build
```

Kiem tra:

```bash
docker compose ps
docker compose logs -f backend
./scripts/wait-for-url.sh http://YOUR_DOMAIN/actuator/health
./scripts/smoke-public.sh http://YOUR_DOMAIN
```

### Cach 2: chay image release

Can:

- file `.env` tren server chua runtime secrets
- `BACKEND_IMAGE` va `FRONTEND_IMAGE` duoc export tu shell hoac duoc workflow release truyen vao

Lenh:

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
./scripts/wait-for-url.sh https://YOUR_DOMAIN/actuator/health
./scripts/smoke-public.sh https://YOUR_DOMAIN
```

## 4. Cach stack nay hoat dong

- Frontend Nginx phuc vu static files.
- Nginx proxy `/api/*` va `/actuator/health` sang backend.
- Frontend mac dinh build voi `VITE_API_URL=` rong, nen FE goi same-origin `/api`.
- Backend dang dung:
  - `server.forward-headers-strategy=framework`
  - `graceful shutdown`
  - CORS env-driven
  - JWT TTL env-driven
  - login rate limiting env-driven
  - Flyway migrations + `ddl-auto=validate`
- `compose.prod.yaml` dung prebuilt image thay vi build context.

## 5. Database bootstrap

Hien tai stack deploy dung:

```env
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
```

Schema bootstrap:

- Flyway tu chay baseline migration `V1__baseline.sql` tren DB rong.
- JPA chi `validate` schema sau khi migration chay xong.

Dieu nay co nghia:

- schema deploy co version va co the review/track qua file migration
- app khong con duoc phep "tu sua DB" luc runtime

Neu dang dung volume/DB cu da duoc tao bang cac ban truoc:

- backup DB truoc
- uu tien migrate tren DB moi/fresh volume
- neu can giu DB cu, phai baseline migration co kiem soat truoc khi cho app start production

## 6. Role va Admin bootstrap

App se tu dam bao 3 role ton tai:

- `customer`
- `staff`
- `admin`

Neu set env bootstrap admin, app se:

- tao admin neu chua co
- hoac cap nhat user trung email thanh admin va reset password theo env

Khong can import `database/queries.sql` de boot production.

Luu y:

- `database/queries.sql` hien tai la demo dump, co sample users va sample data
- khong nen mount truc tiep file nay vao production

## 7. Go-Live Checklist

- `APP_JWT_SECRET` la chuoi random dai va khong commit trong repo
- `APP_CORS_ALLOWED_ORIGINS` dung domain that, khong de localhost
- TLS da bat o reverse proxy / load balancer
- khong expose MySQL port ra public
- stack da migrate schema thanh cong bang Flyway khi boot dau tien
- da bootstrap admin va xac minh login
- `curl /actuator/health` tra `UP`
- backend logs khong con stack trace bat thuong luc startup
- backup strategy cho volume MySQL da ro rang

## 8. GitHub Release Workflow

Repo da co:

- `CI`: `.github/workflows/ci.yml`
- `Release`: `.github/workflows/release.yml`

`release.yml` se:

- build va push backend image len GHCR
- build va push frontend image len GHCR
- neu du secret deploy, upload `compose.prod.yaml` + `scripts/`, chay preflight, va deploy qua SSH
- doi health check URL len voi retry thay vi `curl` mot lan

Secret can co de deploy that:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_GHCR_USERNAME`
- `DEPLOY_GHCR_TOKEN`
- tuy chon: `DEPLOY_HEALTHCHECK_URL`
- tuy chon: `DEPLOY_BASE_URL`

Luu y:

- workflow deploy mac dinh dung thu muc `/opt/technest-shop`
- server phai tu co san file `/opt/technest-shop/.env`
- `.env` tren server chua secret runtime that, khong commit vao repo
- neu co `DEPLOY_BASE_URL`, workflow se chay them `scripts/smoke-public.sh` sau khi app len

## 9. Rollback Toi Thieu

Neu deploy loi:

```bash
docker compose logs --tail=200 backend
docker compose logs --tail=200 frontend
docker compose down
git checkout <last-known-good-tag-or-commit>
docker compose up -d --build
```

Voi thay doi schema/data, rollback an toan can di kem backup DB truoc deploy.
