<div align="center">

# 🧠 NeuralProxy

### A Premium Multi-Tenant AI Gateway for Gemini

[![Java 17](https://img.shields.io/badge/Java-17-007396?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.1-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-7.4-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge)](LICENSE)

**Route, cache, and monitor your Gemini API calls — across multiple keys, tenants, and teams.**

[🚀 Quick Start](#-quick-start) · [📐 Architecture](#-architecture) · [📡 API Reference](#-api-reference) · [⚙️ Configuration](#️-environment-variables)

</div>

---

## ✨ What is NeuralProxy?

**NeuralProxy** is a self-hosted AI gateway that sits between your applications and Google Gemini. It manages API key rotation, caches semantically similar prompts, enforces rate limits per tenant, and gives you a live analytics dashboard — all out of the box.

---

## 🌟 Features

| Category | What you get |
|---|---|
| 🔑 **Key Rotation** | Up to 6 Gemini API keys with round-robin + 60s auto-failover on `401/429/5xx` |
| 🧩 **User Keys** | Validate and pass through user-provided keys — never stored server-side |
| 🧠 **Semantic Cache** | pgvector cosine similarity (threshold `0.08`) — targets **60%+ cost reduction** |
| ⚡ **Redis L1 Cache** | Exact-match cache with 24h TTL for instant repeated responses |
| 🪣 **Rate Limiting** | Bucket4j per-tenant limiting — **100 req/min** per tenant |
| 🔐 **Dual Auth** | JWT Bearer tokens + `X-API-Key` header with SHA-256 hashing |
| 👥 **RBAC** | `ADMIN`, `USER`, and `API_CLIENT` roles |
| 📊 **Live Analytics** | Real-time STOMP/WebSocket dashboard — pushes summary on every request |
| 🛡️ **Circuit Breaker** | Resilience4j wraps Gemini calls — opens at 50% failure in 10-call window |
| 🗄️ **Partitioned Logs** | `request_logs` table partitioned by month (2025–2028) |
| 🎮 **Prompt Playground** | Key source toggle, validate, send, and copy responses in the UI |
| 🏢 **Tenant Management** | Create tenants, generate & reveal API keys (30s reveal window) |
| 🐳 **Docker Ready** | Full `docker-compose` setup — runs in 3 commands |

---

## 📐 Architecture

```
Browser
│
├── React 18  (Vite + Tailwind + Zustand)
│   └── STOMP/SockJS ──► /ws ──► Live analytics push
│
└── Nginx  (port 3000 in Docker │ Vite proxy in dev)
    ├── /api/*      ──► Spring Boot :8080
    ├── /gateway/*  ──► Spring Boot :8080
    └── /ws         ──► Spring Boot :8080 (WebSocket)

Spring Boot (port 8080)
├── JwtFilter → ApiKeyFilter → Security Chain
├── GatewayService
│   ├── RateLimitService      (Bucket4j — in-memory)
│   ├── RedisCacheService     (L1 exact-match, 24h TTL)
│   ├── SemanticCacheService  (pgvector cosine, threshold 0.08)
│   └── GeminiRouter          (round-robin, failover, circuit breaker)
├── AsyncLogService           (@Async → RequestLogRepository → PostgreSQL)
└── WebSocketPublisher        (→ /topic/analytics)

PostgreSQL 16 + pgvector
├── tenants, users, api_keys
├── prompt_cache  (vector(768), HNSW index: m=16, ef=64)
└── request_logs  (partitioned monthly 2025–2028)

Redis 7
└── np:cache:{md5}:{tenantId}  →  response string (24h TTL)
```

---

## ⚙️ Prerequisites

### With Docker (recommended)
- [Docker Desktop 4.x+](https://www.docker.com/products/docker-desktop/) (Engine 24+)

### Without Docker (local dev)
- Java 17 (Eclipse Temurin recommended)
- Maven 3.9+
- PostgreSQL 16 with `pgvector` extension
- Redis 7+
- Node.js 22+

---

## 🚀 Quick Start

### Option A — Docker (3 steps)

```bash
# 1. Clone the repo
git clone https://github.com/GJBarhate/neuralproxy.git
cd neuralproxy

# 2. Add your Gemini key
#    Create backend/.env and set:
#    GEMINI_API_KEYS=your-real-gemini-key

# 3. Start everything
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |

---

### Option B — Local Dev (no Docker)

#### 1. PostgreSQL

```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
psql postgres -c "CREATE DATABASE neuralproxy;"
psql neuralproxy -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Ubuntu / Debian
sudo apt install postgresql-16 postgresql-16-pgvector
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE neuralproxy;"
sudo -u postgres psql neuralproxy -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

#### 2. Redis

```bash
# macOS
brew install redis && brew services start redis

# Ubuntu / Debian
sudo apt install redis-server && sudo systemctl start redis
```

#### 3. Backend

```bash
# Create backend/.env (see Environment Variables below)
# Minimum required:  GEMINI_API_KEYS=your-key-here

cd backend
export $(grep -v '^#' .env | xargs)
mvn spring-boot:run
# ✅ Starts on http://localhost:8080
# ✅ Flyway runs V1 → V2 → V3 migrations automatically
```

#### 4. Frontend

```bash
# Optional: create frontend/.env with VITE_API_BASE_URL=http://localhost:8080
cd frontend
npm install
npm run dev
# ✅ Starts on http://localhost:5173
```

---

## ⚙️ Environment Variables

### `backend/.env`

| Variable | Default | Description |
|---|---|---|
| `GEMINI_API_KEYS` | — | 1–6 Gemini keys, comma-separated, no spaces |
| `JWT_SECRET` | *(base64 string)* | Base64-encoded HMAC-SHA256 secret (min 32 chars decoded) |
| `JWT_EXPIRATION` | `86400000` | Token TTL in milliseconds (24 hours) |
| `DB_HOST` | `localhost` | PostgreSQL hostname (`postgres` in Docker) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `neuralproxy` | Database name |
| `DB_USER` | `postgres` | Database username |
| `DB_PASS` | `postgres` | Database password |
| `REDIS_HOST` | `localhost` | Redis hostname (`redis` in Docker) |
| `REDIS_PORT` | `6379` | Redis port |

### `frontend/.env`

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8080` | Backend URL (dev proxy only; ignored in Docker build) |

---

## 🔑 Default Admin Credentials

```
Email:    admin@neuralproxy.dev
Password: admin123
Role:     ADMIN
```

> **Note:** `DataInitializer` re-verifies and re-encodes the admin password on every startup, so the account always works even if the seed hash drifts.

---

## 📡 API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Exchange credentials for JWT |
| `POST` | `/api/auth/register` | Public | Register new user and get JWT |

### Gateway

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/gateway/prompt` | JWT / API Key | Send prompt, receive Gemini response |
| `GET` | `/api/gateway/validate-key` | Public | Validate a user-provided Gemini API key |

### Analytics

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/analytics/summary` | JWT | Total requests, cache rate, latency, cost |
| `GET` | `/api/analytics/requests` | JWT | Last 20 request logs |
| `GET` | `/api/analytics/cost-over-time` | JWT | Hourly cost for last 24 hours |
| `GET` | `/api/analytics/key-source-breakdown` | JWT | USER vs SYSTEM request counts |

### Tenant Management *(ADMIN only)*

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/tenants` | JWT + ADMIN | List all tenants |
| `POST` | `/api/tenants` | JWT + ADMIN | Create a tenant |
| `POST` | `/api/tenants/{id}/api-keys` | JWT + ADMIN | Generate API key for tenant |
| `GET` | `/api/tenants/{id}/api-keys` | JWT + ADMIN | List API keys for tenant |

#### Example — API Key usage

```bash
curl -X POST http://localhost:8080/api/gateway/prompt \
  -H "X-API-Key: np_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, world!"}'
```

---

## 🧠 Semantic Cache — How it Works

1. Incoming prompts are embedded using **`text-embedding-004`** (768-dimensional vectors).
2. The vector is stored in `prompt_cache` with an **HNSW index** (`m=16`, `ef_construction=64`).
3. A **cosine distance < `0.08`** triggers a cache hit — the stored response is returned instantly.
4. Cache is **skipped** when a user provides their own API key.
5. If the embedding API is down, a **zero vector fallback** is used — the cache simply misses, no errors surfaced.

---

## 🔄 Key Rotation — How it Works

1. System keys are loaded from `GEMINI_API_KEYS` at startup into an `AtomicInteger`-indexed list.
2. Each request **advances the round-robin index** by 1.
3. Any key returning `401`, `429`, or `5xx` is placed in a `failedUntil` map with a **60-second backoff**.
4. The router **skips failed keys** and retries with the next available one.
5. If **all keys** are simultaneously failed → `503 "All Gemini API keys are currently unavailable"`.
6. A **Resilience4j circuit breaker** wraps `callGemini` — if 50% of calls in a 10-call sliding window fail, the breaker opens for **10 seconds** and returns a `FALLBACK` response.
7. **User-provided keys** bypass rotation and cache entirely — they go direct to Gemini and are never stored.

---

## 📝 Git Notes

- Do **not** commit local env files: `backend/.env`, `frontend/.env`
- Do **not** commit build output: `frontend/dist/`, `backend/target/`, `backend/.m2/`, `node_modules/`
- `run-backend.ps1` and `run-frontend.ps1` are included for local Windows development
- Both Docker and non-Docker workflows work after a fresh clone — just recreate your `.env` files

---

## 📄 License

MIT © NeuralProxy Contributors — see [LICENSE](LICENSE) for details.

---

<div align="center">

Made with ☕ and a lot of Gemini tokens.

⭐ Star this repo if NeuralProxy saves you API costs!

</div>
