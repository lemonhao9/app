# HomeCycl'Home

Home bike repair & maintenance booking platform for **LeCycleLyonnais**, Lyon.  
A technician is automatically assigned based on the client's address zone and availability.

> Academic project — CDA certification (Concepteur Développeur d'Applications)

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express (ESM) — Clean Architecture |
| Database | PostgreSQL 16 + node-pg-migrate |
| Real-time | Socket.io |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Maps | Leaflet + OpenStreetMap + geoman.io |
| Geocoding | BAN API (api-adresse.data.gouv.fr) |
| Infra | Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Node.js 20+ and npm

---

## Setup

**1. Configure environment variables**

```bash
cp .env.example .env
```

Fill in the required values (see [Environment variables](#environment-variables)).

**2. Launch**

```powershell
# Windows — opens Docker in a new window, Vite in the current one
.\start.ps1
```

Or manually in two terminals:

```powershell
# Terminal 1 — backend + database
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Terminal 2 — frontend
npm run dev --prefix .\frontend
```

Frontend: http://localhost:5173  
API: http://localhost:3000

---

## Project structure

```
app/
├── backend/
│   ├── migrations/          # node-pg-migrate — ESM format
│   ├── src/
│   │   ├── controllers/
│   │   ├── middlewares/     # authenticate.js, authorize.js, upload.js
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/db.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/ui/   # shadcn/ui + custom (NavBar)
│   │   └── pages/
│   └── package.json
├── docker-compose.yml
├── start.ps1
└── .env
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `API_PORT` | API port (default: 3000) |
| `NODE_ENV` | `development` or `production` |

---

## API routes

| Method | Route | Auth | Role | Description |
|--------|-------|------|------|-------------|
| POST | `/api/v1/auth/signup` | — | — | Create client account |
| POST | `/api/v1/auth/login` | — | — | Login — returns JWT |
| POST | `/api/v1/auth/logout` | — | — | Logout (stateless) |
| GET | `/api/v1/auth/me` | ✅ | any | Get current authenticated user |
| GET | `/api/v1/users` | ✅ | admin | List all users |
| POST | `/api/v1/users/technicians` | ✅ | admin | Create technician account |
| PUT | `/api/v1/users/me` | ✅ | any | Update own profile (picture upload) |
| DELETE | `/api/v1/users/account` | ✅ | any | GDPR account deletion (anonymization) |
| GET | `/api/v1/bikes/me` | ✅ | any | List own bikes |
| POST | `/api/v1/bikes` | ✅ | any | Create bike (photo upload) |
| PUT | `/api/v1/bikes/:id` | ✅ | any | Update bike (photo upload) |
| DELETE | `/api/v1/bikes/:id` | ✅ | any | Delete bike |
| GET | `/api/v1/addresses/geocode` | — | — | Geocode an address via BAN |
| GET | `/api/v1/addresses/zone` | — | — | Resolve zone for a lat/lng point |
| GET | `/api/v1/addresses/me` | ✅ | any | List own addresses |
| GET | `/api/v1/zones` | ✅ | admin | List all zones |
| POST | `/api/v1/zones` | ✅ | admin | Create zone |
| PUT | `/api/v1/zones/:id` | ✅ | admin | Update zone geometry/info |
| DELETE | `/api/v1/zones/:id` | ✅ | admin | Deactivate zone |
| GET | `/api/v1/zones/:id/technicians` | ✅ | admin | List technicians assigned to zone |
| POST | `/api/v1/zones/:id/technicians` | ✅ | admin | Assign technician to zone |
| DELETE | `/api/v1/zones/:id/technicians/:user_id` | ✅ | admin | Unassign technician from zone |
| GET | `/api/v1/fees` | — | — | List active service packages |
| GET | `/api/v1/products` | — | — | List active additional products |

> `slots` and `interventions` routers exist but are not yet implemented (empty routers, work in progress).

---

## Docker

```powershell
# First launch / dependency change
docker-compose down -v
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Code change only (hot-reload via nodemon)
docker-compose restart api

# View logs
docker-compose logs -f api
```

> Always run `docker-compose down -v` (not just `down`) when `package.json` dependencies change — the anonymous volume persists `node_modules` otherwise.

> Production uses `docker-compose.prod.yml`, deployed via CI/CD (GitHub Actions).

---

## Testing routes (PowerShell)

```powershell
# Login and store token
$r = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" `
     -Method POST -ContentType "application/json" `
     -Body (@{email="user@example.com"; password="password123"} | ConvertTo-Json)

# Authenticated request
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/users/technicians" `
     -Method POST -ContentType "application/json" `
     -Headers @{Authorization="Bearer $($r.token)"} `
     -Body (@{email="tech@homecycl.fr"; password="Tech1234!"; name="Jean Technicien"} | ConvertTo-Json)
```

---

## Git workflow

```
main        ← production-ready, merged at end of sprint
dev         ← integration branch
feature/*   ← one branch per feature/ticket
```

Merge: `feature/* → dev` during sprint · `dev → main` at sprint close.
