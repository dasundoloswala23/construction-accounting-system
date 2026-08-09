# Waterman Construction ERP — Next To-Dos, Architecture & Hardcoded Values

_Last updated: 2026-08-09_

## 1. Status

**Built and verified** (build + lint clean, exercised live against the Firebase emulators via Playwright, zero console errors), each as its own git commit:

1. Foundation — scaffold, Tailwind theme (light/dark), Firebase emulator wiring, Auth, routing + protected/role-gated routes, Sidebar/Topbar/Breadcrumb shell, shared component library.
2. Cloud Functions callables — `createUser`, `setUserRole`, `setUserActive`.
3. Settings — Company profile, Users, Permissions matrix, Notifications, Theme, Backup, About.
4. Dashboard (initially mock data, later real-wired — see item 6 below).
5. Products, Supplier Management, Construction Sites — full CRUD.
6. Bank Accounts.
7. Business Pipeline & Quotations (wizard + 8-stage tracker).
8. Purchase Orders (line items, VAT, PDF/Excel export, PO→cheque linkage).
9. Outstanding / Project Payments + the Cloud Functions triggers backing it (the core financial-integrity module).
10. Income + Labour Management.
11. Cheque Management + VAT Suppliers.
12. Debtors.
13. Notifications.
14. Dashboard real-data wiring (`useDashboardData.ts` replacing `mockData.ts`) — committed.
15. **Reports & Analytics** (`src/features/reports/`) — 8 tabs (Overview/Income/Expenses/VAT/Suppliers/Debtors/Sites/Labour), a This Month/Last 3 Months/All Time range filter, `recharts` breakdown/comparison charts, and 4 downloadable reports (Financial Summary, Income Statement, Expense Statement, VAT Report) each exportable to PDF and Excel. Verified against the emulator with real data (e.g. All Time: LKR 525K income, LKR 115.4K expenses, matching the Dashboard's own numbers), zero console errors. Committed.

**Not started:**

- Full hardening pass (see §2).
- Final production redeploy.

**Live deployment:** connected to the real Firebase project `watermansystem-48582` (Hosting + Firestore/Storage rules + Cloud Functions all deployed at least once). Two things remain blocked on the user, not on further coding:

- Enable the **Email/Password** sign-in provider: Firebase Console → Authentication → Sign-in method (no CLI equivalent).
- Generate a service-account key (Console → Project Settings → Service Accounts → Generate new private key) and hand over its **local file path only** (never contents) so `scripts/seedProdAdmin.mjs` can bootstrap the first real Admin login.

## 2. Remaining Work

**Hardening pass — done:**

- Firestore/Storage rules audited against the permission matrix for all 3 roles and every collection. Found and fixed one real gap: `labour_payments` create allowed `isAccountant()`, but accountants have only view access to Labour Management — only Admin/Manager should record payments (`firestore.rules`). Verified with a direct client-SDK rules test (bypassing the UI entirely) for both the fix and several other role/collection combinations, plus a live cross-role Playwright pass confirming nav visibility and route-level blocking match the matrix exactly.
- PDF exports (`src/shared/lib/exporters.ts`) now carry a company-name header, a "Generated on" timestamp, alternating row shading, and a page-number footer instead of a bare title + table. Verified by inspecting the rendered PDF output directly.
- Empty/loading states swept across every module — pages using the shared `DataTable` get this for free; the handful of custom card-based views (Debtors, Outstanding tabs, Pipeline, Documents) all already had their own inline guards. No gaps found.
- Responsive check at a 390px mobile width found and fixed a real bug: the sidebar's mobile hamburger button only shrank it to the 76px desktop icon-rail (`sidebarCollapsed`), which still ate a third of the screen and clipped page content (confirmed on the quotation wizard). Sidebar is now a proper off-canvas drawer below the `lg` breakpoint with its own `mobileSidebarOpen` state, a tap-outside backdrop, and auto-close on navigation (`src/app/Sidebar.tsx`, `src/app/Topbar.tsx`, `src/app/providers/uiStore.ts`).

**Still open, in priority order:**

1. **Final production redeploy** — rebuild Hosting, redeploy Firestore rules/indexes, Storage rules, and all Cloud Functions now that the hardening pass (including the rules fix) is done.
2. **User-blocked items** (see §1) — ping the user once ready to bootstrap production Admin login.

## 3. Architecture

- **Stack**: React 19 + TypeScript (strict, `erasableSyntaxOnly`) + Vite 8, Tailwind CSS v4 (CSS-first `@theme` config, `.dark` class toggle), `react-router` v8, Firebase modular SDK v9+ (Auth/Firestore/Storage/Functions), Cloud Functions v2 (Node 22, ESM).
- **Folder layout**: feature-based, `src/features/<module>/` (each with `api.ts`, page component(s), `components/`); `src/shared/` for the cross-cutting component library (`components/`), hooks (`hooks/`), and libs (`lib/firebase.ts`, `currency.ts`, `permissions.ts`, `sequence.ts`, `exporters.ts`, `timeline.ts`); `src/app/` for routing, layout shell (Sidebar/Topbar), and providers (Auth, Theme, UI store).
- **Data layer**: no TanStack Query in practice — plain custom `onSnapshot`-based hooks (`useCollection`, `useDocument` in `src/shared/hooks/`) are the live data layer. Zustand is UI-state only (theme, sidebar collapse) and never mirrors Firestore data.
- **Forms**: `react-hook-form` + `zod`, one schema per entity.
- **Charts**: `recharts`, palette fixed per the `dataviz` skill (income green `#16a34a`, expenses red `#dc2626`).
- **PDF/Excel export**: `pdfmake` + `xlsx`, isolated in `src/shared/lib/exporters.ts` and **dynamically imported** on click only (keeps the ~2MB Roboto font payload out of the main bundle).
- **Firestore data model** — ~19 collections; the key modeling decision is that **Quotations, Business Pipeline, and Outstanding are three views over one lifecycle**, not three data stores: a `quotations` doc (Draft→Submitted→Approved/Rejected) spawns a `projects` doc on approval, which both the Pipeline board and Outstanding module read/write for the rest of its life (PO Received → Advance Received → Active → Invoiced → Done). Full collection table lives in the build plan at `C:\Users\thari\.claude\plans\real-world-flow-customer-requests-indexed-wozniak.md` (§ Firestore Data Model) if a refresher is ever needed.
- **Derived/aggregate fields are Cloud-Functions-only**, never client-writable: `projects.receivedAmount/outstandingAmount`, `suppliers.outstandingBalance`, `construction_sites.spentToDate`, `bank_accounts.currentBalance`, `labour.outstandingBalance/totalPaidAllTime`. Enforced two ways: (1) Firestore rules explicitly block client writes to these field names via an `unchanged([...])` helper, (2) the only code path that touches them is `functions/src/triggers.ts` (`onProjectPaymentWrite`, `onChequeStatusChange`, `onBankTransactionWrite`, `onPurchaseOrderWrite`, `onLabourPaymentWrite`, `scanOverdue`), running under the Admin SDK which bypasses rules entirely.
- **Sequence numbers** (`QTN-2026-0001`, `PO-2026-0003`, `RCP-2026-0001`) are generated client-side via Firestore transactions (`src/shared/lib/sequence.ts`) against `counters/{name}` docs — a deliberate, judged-safe deviation from doing it in Cloud Functions, since these are display references, not money-bearing fields.
- **Auth/permissions**: role (`admin | accountant | manager`) stored as a Firebase Auth custom claim (checked in Firestore rules via `request.auth.token.role`) and mirrored into `users/{uid}.role` for UI reads. The UI's own permission checks (`src/shared/lib/permissions.ts`) read the Firestore doc field, not the token claim — a nuance to remember if the two ever need to be kept in sync differently.
- **Environments**: `.env` (gitignored) = emulator config, used by `npm run dev`. `.env.production` (gitignored) = real `watermansystem-48582` Firebase web config + `VITE_USE_FIREBASE_EMULATORS=false`, picked up automatically by `vite build`. `.firebaserc` has `default: demo-waterman-erp` (emulators) and `prod: watermansystem-48582` (used via explicit `--project` flag on deploy commands).

## 4. Currently Hardcoded Values — What & How to Remove

| What | Where | How to fix later |
|---|---|---|
| Default VAT 18% | `src/features/purchase-orders/components/POFormPanel.tsx:33`, `src/features/pipeline/schema.ts:61` (`vatPercent: 18`) | Read from `companies/main.defaultVatPercent` instead (the field already exists on the `Company` entity and is editable via Settings > Company) — fetch the company doc and use its value as the form default. |
| Dev-only Admin bootstrap credentials | `scripts/seedAdmin.mjs` (`admin@waterman.lk` / `Admin@12345` + a placeholder company profile) | Intentional, emulator-only convenience. `scripts/seedProdAdmin.mjs` already requires explicit email/password/service-account-path args with no defaults — never reuse the emulator defaults in production. |
| Dashboard greeting always says "Good morning" | `src/features/dashboard/DashboardPage.tsx:20` | Compute from `today.getHours()` (e.g. <12 morning, <18 afternoon, else evening) instead of a fixed string. Cosmetic only. |
| Payment-method option lists duplicated per form | `POFormPanel.tsx`, `ReceivePaymentModal`, `AddIncomeModal` each define their own local array | Consolidate into one shared constant (e.g. `src/shared/lib/paymentMethods.ts`) and import everywhere. Not urgent — lists are currently in sync by coincidence, not by shared source. |
| Product/quotation category & unit lists | `PRODUCT_CATEGORIES` / `PRODUCT_UNITS` in `src/features/products/api.ts`, quotation categories in `src/features/pipeline/schema.ts` | Fine for v1. If the business later wants to manage these themselves, move to a Settings-editable Firestore doc (e.g. `companies/main.categories`) instead of a hardcoded array. |
| Currency fixed to LKR | `src/shared/lib/currency.ts` (`Intl.NumberFormat('en-LK', { currency: 'LKR' })`) | Intentional single-currency scope for this business. Only revisit if multi-currency support is ever requested — would need a currency field per transaction, not just a formatting change. |
| `scanOverdue` scheduled Cloud Function | `functions/src/triggers.ts` | Never exercised locally (no Pub/Sub emulator support) — verified by code review only. Confirm it actually fires correctly once deployed to production (check Cloud Scheduler logs after the first scheduled run). |
| Reports date ranges fixed to 3 presets | `src/features/reports/api.ts` (`REPORT_RANGES`: This Month / Last 3 Months / All Time) | No custom date-range picker yet. Add one later if the business wants an arbitrary start/end date instead of the 3 presets. |
