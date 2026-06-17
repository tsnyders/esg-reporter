# ESG Reporter — Architecture

---

## 1. Overview

ESG Reporter is a **single Next.js application**. There are no separate microservices, no Python engine, and no external database server. The API layer runs as Hono routes mounted inside Next.js API routes. The database is a local SQLite file managed by Drizzle ORM via `better-sqlite3` (native synchronous SQLite driver).

```
Browser → Next.js :3000
              │
              ├── /app/*          ← React pages (Kai)
              │
              └── /api/v1/*       ← Hono router (Ethan)
                      │
                      └── SQLite (local.db via Drizzle)
```

---

## 2. Repository Layout

```
esg-reporter/
├── ARCHITECTURE.md
├── package.json
├── next.config.ts
├── drizzle.config.ts
├── middleware.ts                    ← Clerk route protection
├── local.db                         ← SQLite database file (gitignored)
├── .env.local                       ← env vars (gitignored)
├── .github/
│   └── workflows/
│       └── ci.yml                   ← lint + typecheck + test (Damon)
└── src/
    ├── app/
    │   ├── layout.tsx               ← ClerkProvider root
    │   ├── page.tsx                 ← redirect → /emissions or /sign-in
    │   ├── globals.css
    │   ├── (dashboard)/
    │   │   ├── emissions/page.tsx
    │   │   ├── onboarding/page.tsx
    │   │   └── reports/page.tsx
    │   └── api/
    │       └── [[...route]]/
    │           └── route.ts         ← Hono entry (all API methods)
    ├── components/
    │   ├── dashboard/
    │   │   └── StatCards.tsx
    │   ├── emissions/
    │   │   └── EmissionForm.tsx
    │   └── onboarding/
    │       └── CompanyStep.tsx
    └── lib/
        ├── api-client.ts            ← apiFetch() with Clerk Bearer header
        ├── db/
        │   ├── client.ts            ← Drizzle + better-sqlite3
        │   ├── schema.ts            ← tenants, companies, emissionRecords, reportJobs
        │   └── utils.ts             ← getOwnedCompany() shared guard
        ├── hono/
        │   ├── middleware/
        │   │   └── tenant.ts        ← Clerk JWT verify + upsert tenant row
        │   └── routes/
        │       ├── health.ts
        │       ├── companies.ts
        │       ├── emissions.ts
        │       ├── report-jobs.ts
        │       └── reports.ts       ← export endpoint only
        └── hooks/
            ├── useCompany.ts
            └── useEmissions.ts
```

---

## 3. Authentication & Tenant Isolation

```
Clerk (frontend)
  → useAuth().getToken()
  → Authorization: Bearer <JWT>
        ▼
Hono tenantMiddleware  (src/lib/hono/middleware/tenant.ts)
  → clerk.verifyToken(token)
  → extract org_id ?? sub  →  clerkOrgId
  → upsert tenants row     →  c.set('tenantId', ...)
        ▼
getOwnedCompany(companyId, tenantId)   (src/lib/db/utils.ts)
  → joins companies.tenantId — returns null → 404 on cross-tenant access
```

**Rule:** Every route touching `emissionRecords` or `reportJobs` MUST call `getOwnedCompany()` before any DB read/write.

---

## 4. Database Schema (Drizzle ORM / SQLite)

File: `src/lib/db/schema.ts`

```
tenants          id (text PK, uuid), clerkOrgId (UNIQUE), name, createdAt
companies        id (text PK, uuid), tenantId → tenants.id, name, industry,
                 country, reportingYear, createdAt
emissionRecords  id (text PK, uuid), companyId → companies.id,
                 scope ('1'|'2'|'3'), category, activityData, activityUnit,
                 emissionFactor, co2eKg, dataSource, periodStart, periodEnd, createdAt
reportJobs       id (text PK, uuid), companyId → companies.id,
                 status ('pending'|'processing'|'done'|'failed'), reportType,
                 outputUrl, createdAt, completedAt
```

---

## 5. API Contract (Hono — Next.js API routes)

All `/api/v1/*` except `/health` require `Authorization: Bearer <Clerk JWT>`.

| Method | Path | Description | Owner |
|--------|------|-------------|-------|
| GET | `/api/v1/health` | Liveness probe | Ethan |
| GET | `/api/v1/companies` | List tenant companies | Ethan |
| POST | `/api/v1/companies` | Create company | Ethan |
| GET | `/api/v1/emission-records?companyId=` | List emission records | Ethan |
| POST | `/api/v1/emission-records` | Create emission record | Ethan |
| GET | `/api/v1/report-jobs?companyId=` | List report jobs | Ethan |
| POST | `/api/v1/report-jobs` | Create report job | Ethan |
| GET | `/api/v1/reports/export?companyId=&format=pdf\|csv` | Export report | Ethan |

---

## 6. Branch Strategy

```
main        ← protected, requires PR + CI green + 1 review
develop     ← protected, requires PR + CI green
feature/*   ← developer branches, PR into develop
```

---

## 7. CI Pipeline (.github/workflows/ci.yml)

Triggers: `pull_request` targeting `main` or `develop`

Jobs (all run on `ubuntu-latest`, Node 22, single `npm ci`):
1. `lint` — `npm run lint`
2. `typecheck` — `npm run typecheck`
3. `test` — `npm run test` (Vitest + React Testing Library, jsdom, SQLite in-memory)

No Docker services required. SQLite runs in-process.

---

## 8. Environment Variables

```
# .env.local
DATABASE_URL=local.db                          # path to SQLite file (better-sqlite3); :memory: for tests

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=             # from https://dashboard.clerk.com
CLERK_SECRET_KEY=

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/emissions
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
```

---

## 9. Acceptance Criteria

| ID | Criterion | Tenant Isolation |
|----|-----------|-----------------|
| AC-01 | `GET /api/v1/health` returns `{ status: "ok" }` 200 | No |
| AC-02 | POST `/companies` → row in `companies` with correct `tenantId` | Yes |
| AC-03 | POST `/emission-records` → row with `co2eKg = activityData × emissionFactor` | Yes — companyId must belong to tenant |
| AC-04 | GET `/emission-records` returns only records for tenant's company | **Required** |
| AC-05 | Dashboard StatCards show correct tCO₂e aggregated from DB | Yes |
| AC-06 | Onboarding CompanyStep persists company to DB and redirects | Yes |
| AC-07 | EmissionForm POSTs valid record and clears on success | Yes |
| AC-08 | `GET /reports/export?format=csv` returns CSV file | Yes — 404 on cross-tenant |
| AC-09 | `GET /reports/export?format=pdf` returns PDF stub | Yes — 404 on cross-tenant |
| AC-10 | No cross-tenant emission record leakage across any endpoint | **Required** |
