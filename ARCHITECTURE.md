# ESG Reporter — Architecture

**Stack: 2 — Next.js / React / MERN (Hono API / PostgreSQL / MongoDB optional)**
**Lead: Dominic Cross**
**Active Developers: Kai Chen (Frontend), Ethan Brooks (Backend), Damon Miller (DevOps), Trinity Nix (QA)**
**Date: 2026-06-11**

---

## 1. Repository Layout (Monorepo)

```
esg-reporter/
├── ARCHITECTURE.md          ← this file (source of truth)
├── package.json             ← root workspace
├── .github/
│   └── workflows/
│       ├── ci.yml           ← lint + test on PR (Damon)
│       └── deploy.yml       ← deploy on merge to main (Damon, Phase 2)
├── apps/
│   ├── web/                 ← Next.js 15 / React 19 (Kai)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── (dashboard)/
│   │   │       ├── emissions/page.tsx
│   │   │       ├── onboarding/page.tsx
│   │   │       └── reports/page.tsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   └── StatCards.tsx
│   │   │   ├── emissions/
│   │   │   │   └── EmissionForm.tsx
│   │   │   └── onboarding/
│   │   │       └── CompanyStep.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           ← apiFetch() with Clerk Bearer
│   │   │   └── hooks/
│   │   │       ├── useCompany.ts
│   │   │       └── useEmissions.ts
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                 ← Hono v4 REST API on :3141 (Ethan)
│   │   ├── src/
│   │   │   ├── index.ts         ← server entry
│   │   │   ├── middleware/
│   │   │   │   └── tenant.ts    ← Clerk JWT verify + tenantId extraction
│   │   │   ├── routes/
│   │   │   │   ├── companies.ts
│   │   │   │   ├── emissions.ts
│   │   │   │   ├── reports.ts
│   │   │   │   └── health.ts
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    ← Drizzle schema (tenants, companies, emissionRecords, reportJobs)
│   │   │   │   └── client.ts    ← Drizzle + node-postgres client
│   │   │   └── services/
│   │   │       └── reportExport.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── esg-engine/          ← FastAPI carbon calculation engine on :8000 (Ethan)
│       ├── main.py
│       ├── routers/
│       │   └── calculate.py
│       ├── services/
│       │   ├── emission_factors.py  ← IPCC AR6 / DEFRA lookup
│       │   └── calculator.py
│       ├── schemas.py
│       └── requirements.txt
└── docker-compose.yml       ← PostgreSQL 16 local dev (Damon)
```

---

## 2. Service Map

```
Browser → Next.js :3000 ─── Clerk JWT ───► Hono API :3141 ──► PostgreSQL 16
                                                    │
                                                    └─── HTTP ───► FastAPI ESG Engine :8000
```

| Port | Service | Owner | Runtime |
|------|---------|-------|---------|
| 3000 | Next.js frontend | Kai Chen | Next.js 15 / React 19 |
| 3141 | Hono API server | Ethan Brooks | Node.js 22 + Hono v4 |
| 8000 | FastAPI ESG engine | Ethan Brooks | Python 3.12 + FastAPI |
| 5432 | PostgreSQL | Damon Miller | Docker (local) |

---

## 3. Authentication & Tenant Isolation

```
Clerk (frontend) → useAuth().getToken() → Authorization: Bearer <JWT>
                                               ▼
Hono tenantMiddleware (apps/api/src/middleware/tenant.ts)
  → verifyToken(token) → payload.org_id ?? payload.sub → c.set('tenantId', ...)
                                               ▼
All DB queries scoped through getOwnedCompany(companyId, tenantClerkOrgId)
  → joins tenants.clerkOrgId + companies.tenantId — cross-tenant returns 404
```

**Rule:** Every route touching `emissionRecords` or `reportJobs` MUST call `getOwnedCompany()` before any DB read/write.

---

## 4. Database Schema (Drizzle ORM / PostgreSQL 16)

File: `apps/api/src/db/schema.ts`

```
tenants          id (uuid PK), clerkOrgId (UNIQUE), name, createdAt
companies        id (uuid PK), tenantId → tenants.id, name, industry, country, reportingYear, createdAt
emissionRecords  id (uuid PK), companyId → companies.id,
                 scope ('1'|'2'|'3'), category, activityData, activityUnit,
                 emissionFactor, co2eKg, dataSource, periodStart, periodEnd, createdAt
reportJobs       id (uuid PK), companyId → companies.id, status, reportType,
                 outputUrl, createdAt, completedAt
```

---

## 5. API Contract (Hono :3141)

All `/api/v1/*` require `Authorization: Bearer <Clerk JWT>`.

| Method | Path | Status | Owner |
|--------|------|--------|-------|
| GET | `/api/v1/health` | Phase 1 | Ethan |
| GET | `/api/v1/companies` | Phase 1 | Ethan |
| POST | `/api/v1/companies` | Phase 1 | Ethan |
| GET | `/api/v1/emission-records?companyId=` | Phase 1 | Ethan |
| POST | `/api/v1/emission-records` | Phase 1 | Ethan |
| GET | `/api/v1/report-jobs?companyId=` | Phase 1 | Ethan |
| POST | `/api/v1/report-jobs` | Phase 1 | Ethan |
| GET | `/api/v1/reports/export?companyId=&format=pdf\|csv` | Phase 2 | Ethan |

---

## 6. FastAPI ESG Engine Endpoints (:8000)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| POST | `/calculate` | Single emission record CO₂e |
| POST | `/calculate/batch` | Batch calculation |

---

## 7. Branch Strategy

```
main        ← protected, requires PR + CI green + 1 review
develop     ← protected, requires PR + CI green
feature/*   ← developer branches, PR into develop
```

---

## 8. CI Pipeline (.github/workflows/ci.yml)

Triggers: `pull_request` targeting `main` or `develop`

Jobs:
1. `lint` — ESLint (web + api), ruff (esg-engine)
2. `test:api` — Vitest unit tests (apps/api)
3. `test:web` — Vitest + React Testing Library (apps/web)
4. `test:engine` — pytest (apps/esg-engine)
5. `typecheck` — `tsc --noEmit` (web + api)

---

## 9. Environment Variables

```
# apps/web/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3141

# apps/api/.env
DATABASE_URL=postgresql://esg:esg@localhost:5432/esg_reporter
CLERK_SECRET_KEY=
ESG_ENGINE_URL=http://localhost:8000

# apps/esg-engine/.env
PORT=8000
```

---

## 10. Acceptance Criteria (Trinity)

| ID | Criterion | Tenant Isolation |
|----|-----------|-----------------|
| AC-P1-01 | `GET /api/v1/health` returns 200 | No |
| AC-P1-02 | POST company → row in `companies` table | Yes — tenantId scoped |
| AC-P1-03 | POST emission-record → row in `emissionRecords` | Yes — companyId must belong to tenant |
| AC-P1-04 | GET emission-records returns only tenant's data | **Required** |
| AC-P2-01 | Dashboard stat cards show real tCO₂e from DB | Yes |
| AC-P2-02 | Onboarding company step persists to DB | Yes |
| AC-P2-03 | Emissions form POSTs valid record | Yes |
| AC-P2-04 | `GET /reports/export?format=pdf` returns PDF | Yes — 404 on cross-tenant |
| AC-P2-05 | `GET /reports/export?format=csv` returns CSV | Yes — 404 on cross-tenant |
| AC-P2-06 | FastAPI POST `/calculate` returns CO₂e | N/A |
| AC-P2-07 | No cross-tenant emission record leakage | **Required** |
