# Waterman Construction ERP — System Plan

_Last updated: 2026-08-09_

## 1. Overview

A production web ERP for **Waterman Construction (Pvt) Ltd** (Sri Lanka) covering the full lifecycle of a construction contracting business: quotations → approval → purchase orders → supplier payments → customer payments → outstanding/debtor tracking → labour payments → bank/cash reconciliation → VAT → reporting. Built as a single-tenant system for one company today (see §7 on multi-tenancy).

**Live**: https://watermansystem-48582.web.app (Firebase project `watermansystem-48582`)
**Source**: pushed to `github.com/dasundoloswala23/Waterman_Construction_System`

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + TypeScript (strict) + Vite 8 |
| Styling | Tailwind CSS v4 (CSS-first `@theme`), light/dark mode |
| Routing | `react-router` v8 |
| Forms | `react-hook-form` + `zod` |
| Charts | `recharts` |
| PDF/Excel | `pdfmake` + `xlsx` (SheetJS), lazy-loaded on click |
| State | Zustand (UI-only — sidebar/theme, never mirrors server data) |
| Backend | Firebase: Auth, Cloud Firestore, Cloud Storage, Cloud Functions v2 (Node 22) |
| Hosting | Firebase Hosting |

## 3. Architecture

- **Folder layout**: feature-based — `src/features/<module>/` (each with `api.ts`, page component(s), `components/`); `src/shared/` for the cross-cutting component library, hooks, and libs; `src/app/` for routing, layout shell, and providers.
- **Data layer**: no TanStack Query in practice — plain custom `onSnapshot`-based hooks (`useCollection`, `useDocument` in `src/shared/hooks/`) are the live data layer, so every screen reflects writes (including ones made by Cloud Function triggers) without a manual refetch.
- **Derived/aggregate fields are Cloud-Functions-only, never client-writable**: `projects.receivedAmount/outstandingAmount/creditBalance`, `suppliers.outstandingBalance`, `construction_sites.spentToDate`, `bank_accounts.currentBalance`, `cash_accounts/main.currentBalance`, `labour.outstandingBalance/totalPaidAllTime`, per-invoice `project_documents.receivedAmount/outstandingAmount`. Enforced two ways: Firestore rules block client writes to those field names (`unchanged([...])` or an outright `allow write: if false`), and the only code that touches them is `functions/src/triggers.ts`, running under the Admin SDK which bypasses rules entirely.
- **Auth/permissions**: role (`admin | accountant | manager`) stored as a Firebase Auth custom claim (checked in Firestore rules via `request.auth.token.role`) and mirrored into `users/{uid}.role` for the UI. `src/shared/lib/permissions.ts` is the single source of truth for the role → module → access-level matrix, read by both the UI (hide/disable actions, `RequireModule` route guard) and — by hand — mirrored into `firestore.rules`.
- **Environments**: `.env` (emulator, gitignored) for `npm run dev`; `.env.production` (real Firebase config, gitignored) picked up automatically by `vite build`. `.firebaserc` has `default: demo-waterman-erp` (emulator) and `prod: watermansystem-48582`.

## 4. Modules (17)

| # | Module | What it does |
|---|---|---|
| 1 | Dashboard | KPI tiles, income/expense trend, upcoming cheques, alerts — real aggregate data |
| 2 | Business Pipeline & Quotations | Multi-step quotation wizard → approval → spawns a `projects` doc; 8-stage tracker board |
| 3 | Purchase Orders | Line items, VAT (configurable default + override w/ reason), PDF/Excel export, cheque/bank/cash payment |
| 4 | Supplier Management | CRUD + outstanding balance (derived) |
| 5 | Products | Reference data CRUD |
| 6 | Construction Sites | Budget, spend-to-date (derived), status |
| 7 | Income | Customer payments not tied to a specific project (walk-in/unassociated) |
| 8 | Bank Accounts | Multiple accounts, ledger, bank-to-bank transfers, Cash Account card |
| 9 | Labour Management | Workers, payments (cash/bank), outstanding balance |
| 10 | Outstanding | The core financial module — project detail (Overview/Payments/Invoices/Receipts/Documents/Timeline), multi-invoice payment allocation, receipts, immutable timeline |
| 11 | Debtors | Customer-receivables view (thin reuse of Outstanding's components) |
| 12 | Cheque Management | Unified cheque table + status transitions (pending → cleared/bounced) |
| 13 | VAT Suppliers | Aggregate VAT-by-supplier view |
| 14 | Notifications | Cheque-due, overdue, receivable alerts (from `scanOverdue`) |
| 15 | Reports & Analytics | 8 tabs (Overview/Income/Expenses/VAT/Suppliers/Debtors/Sites/Labour), site filter, trend badges, 9 downloadable reports |
| 16 | Settings | Company profile, Users, Permissions matrix, Notifications, Theme, Backup, About |
| 17 | Auth | Email/password login, remember-me, forgot-password |

## 5. Firestore Data Model (~21 collections)

| Collection | Key fields | Notes |
|---|---|---|
| `companies/main` | name, tin, defaultVatPercent, allowOverdraft | Singleton |
| `users/{uid}` | displayName, email, role, active | uid = Auth UID; role also a custom claim |
| `suppliers/{id}` | companyName, tin, vatRegistered, **outstandingBalance*** | |
| `products/{id}` | code, name, category, unit, status | |
| `construction_sites/{id}` | name, budget, **spentToDate*** , status | |
| `quotations/{id}` | customer{}, workItems[], pricing{}, milestones[], documents[], status | Draft→Submitted→Approved/Rejected |
| `projects/{id}` | contractValue, pipelineStage, **receivedAmount/outstandingAmount/creditBalance*** | Spawned on quotation approval; shared by Pipeline + Outstanding |
| `project_payments/{id}` | projectId, amount, paymentType, allocations[], status | Single write path for all customer payments (Income = a filtered view over this) |
| `project_documents/{id}` | projectId, type (incl. `invoice`), **receivedAmount/outstandingAmount*** (invoices only) | |
| `receipts/{id}` | receiptNo (sequential), amount, companySnapshot | Snapshotted, not live-joined |
| `timeline/{id}` | projectId, type, actorUid, timestamp | Immutable (create-only) |
| `purchase_orders/{id}` | poNumber, lineItems[], vatPercent, vatOverridden, bankAccountId, grandTotal, status | |
| `bank_accounts/{id}` | bankName, openingBalance, **currentBalance*** | |
| `bank_transactions/{id}` | bankAccountId, type, amount, source, transferId | Append-only ledger |
| `cash_accounts/main` | **currentBalance*** | Singleton, mirrors bank_accounts |
| `cash_transactions/{id}` | type, amount, source | Append-only ledger |
| `labour/{id}` | fullName, role, **outstandingBalance/totalPaidAllTime*** | |
| `labour_payments/{id}` | workerId, amount, date | |
| `cheques/{id}` | direction, chequeNumber, dueDate, status | Unified for PO-side and customer-side |
| `vat_invoices/{id}` | supplierId, invoiceNumber, vatAmount, totalAmount | |
| `notifications/{id}` | type, title, amount, read | Populated by scheduled/triggered functions only |
| `counters/{name}` | value | Transactional sequence source for QTN/PO/RCP numbers |

\* Derived — Cloud Functions only, see §3.

### Cloud Functions (`functions/src/triggers.ts` + `index.ts`)

`onProjectPaymentWrite`, `onChequeStatusChange`, `onBankTransactionWrite`, `onCashTransactionWrite`, `onPurchaseOrderWrite`, `onLabourPaymentWrite`, `scanOverdue` (daily scheduled), plus callables `createUser`/`setUserRole`/`setUserActive` (Admin-gated user provisioning — there is no public sign-up screen).

## 6. Security Model

Three roles — **Admin** (everything), **Accountant** (financial modules, read-only Reports, no Settings), **Manager** (Dashboard/Construction Sites/Labour/Purchase Orders(view)/Reports(view), no financial write access) — enforced in both the UI (`src/shared/lib/permissions.ts`) and Firestore/Storage rules (`firestore.rules`, `storage.rules`). Every derived financial field is blocked from client writes regardless of role; only Cloud Functions (Admin SDK) can touch them.

## 7. Known Scope Boundaries (deferred, not gaps)

- **Multi-tenancy** — single company today, `companyId` scoping deferred until a second company is actually needed (see `NEXTTODOS.md` §6).
- **5-role model** (Site Manager, Viewer) — deferred, current 3 roles cover the business as-is.
- Debtor aging buckets, reminder log, customer statements; supplier duplicate-detection — deferred, listed in `NEXTTODOS.md` §6.

## 8. Database Cost Estimate — 10 Active Sites / Month

This models Firestore + Cloud Functions + Storage + Hosting cost at a **steady-state 10-active-construction-sites-per-month** operating scale. All Firebase pricing figures below are approximate published rates (Blaze plan, US region) — **confirm exact current numbers with the [Firebase Pricing Calculator](https://firebase.google.com/pricing) before budgeting**, since rates and free-tier limits do change.

### 8.1 Assumed monthly activity (per site → × 10 sites)

| Event | Per site/month | × 10 sites |
|---|---:|---:|
| Purchase Orders | 12 | 120 |
| Customer payments | 4 | 40 |
| Labour payments | 16 | 160 |
| Invoices uploaded | 2 | 20 |
| VAT invoices (from VAT-enabled POs) | 8 | 80 |
| Timeline events | 8 | 80 |
| Notifications generated | 6 | 60 |

That's **~560 new "event" documents/month**. Each event write also fires a Cloud Function trigger that updates 1–3 derived parent documents (project/supplier/site/bank or cash account/labour worker/invoice), so **total Firestore writes land around ~1,400/month** and **Cloud Function invocations around the same, ~1,400–1,500/month**.

### 8.2 Writes, Functions, Storage — comfortably free

| Resource | Monthly usage (est.) | Free tier | Cost |
|---|---:|---:|---:|
| Firestore writes | ~1,400 | 20,000/day (~600K/mo) | **$0** |
| Cloud Function invocations | ~1,500 | 2,000,000/mo | **$0** |
| Cloud Function compute | trivial (sub-second triggers) | 400,000 GB-seconds/mo | **$0** |
| Cloud Storage (invoices, cheque images, bank slips) | ~15–20 MB/mo growth | 5 GB stored, 1 GB/day download | **$0** for years |
| Firestore stored data | ~1 MB/mo growth | 1 GiB | **$0** for years |
| Hosting bandwidth | small SPA, low traffic | 10 GB/mo | **$0** |

At this scale, none of the above will cost anything for a long time — Firestore document storage for small JSON records (~1–2 KB each) accumulates far slower than the free tier's 1 GiB.

### 8.3 Reads — the one real cost driver

The app's current data layer (`useCollection`) subscribes to **entire collections** with `onSnapshot` — every time a user opens Dashboard, Reports, or most list pages, it re-fetches the full collection (billed as 1 read per document on that "cold" listener attach). This is simple and correct, but it's the one place usage cost actually shows up as collections grow.

**Estimated accumulated collection sizes after 12 months** at the activity level above: purchase_orders ~1,440, project_payments ~480, labour_payments ~1,920, project_documents ~500, vat_invoices ~960, cheques ~200, plus small reference collections (suppliers, projects, sites) ~200 combined ≈ **~5,700 documents** touched by a full Dashboard/Reports load.

Assuming **4 concurrent office staff** (Admin/Accountant/Manager accounts) each navigating between Dashboard/Reports/list pages roughly **15 times a workday** (each navigation re-attaches listeners = a fresh full read):

```
60 page-loads/day × 5,700 reads ≈ 342,000 reads/day
− 50,000/day free tier
= ~292,000 billable reads/day → ~8.76M billable reads/month
```

At an approximate rate of **$0.036 per 100,000 reads**: 8.76M ÷ 100,000 × $0.036 ≈ **$3–$5/month**.

### 8.4 Total estimate

**Roughly $5–$15/month** at 10 active sites and 4 concurrent staff checking the app throughout the day — realistically often landing near the low end or within the free tier entirely on lighter-usage months. This is a small number in absolute terms, but it's worth being deliberate about because **the read pattern, not data volume, is what would eventually need attention** if the business scales up (more sites, more staff, more frequent report-checking) or usage habits get heavier (e.g., leaving Dashboard open with auto-refresh).

### 8.5 If/when this needs optimizing later

- Convert Dashboard/Reports' full-collection listeners into **scoped queries** (date-range `where` filters instead of fetching everything, since most of these hooks already accept `QueryConstraint[]`).
- Add **denormalized rollup documents** (e.g., a single `dashboard_summary` doc updated by the existing Cloud Functions triggers) instead of recomputing KPIs client-side from full collections on every page load — this was already flagged in `NEXTTODOS.md` as a "revisit if it grows large enough to matter" item.
- Cache collection data across navigations (e.g., a lightweight in-memory store keyed by collection) instead of re-subscribing on every route change.

None of this is needed today at 10 sites/month — it's the natural next lever if the business scales up materially.
