# Waterman Construction ERP — Next To-Dos, Architecture & Hardcoded Values

_Last updated: 2026-08-09_

## 0. Phase 2 — Financial Integrity Upgrade (Done)

After the initial 17-module build, the user provided a much more rigorous module-by-module spec (multi-tenant architecture, 5 roles, ledger-first accounting, cash ledger, bank transfers, multi-invoice allocation, configurable VAT, aging/reminders, etc.) and asked to use it as an upgrade checklist against the live system. Agreed scope: **defer full multi-tenancy** (speculative "future" need, one real company today) and **tackle financial-integrity gaps first** — done below; roles/aging/reminders/reports-polish/duplicate-detection are deferred (§6).

- **Cash ledger** — new `cash_accounts/main` + `cash_transactions` (mirrors the existing bank ledger exactly, with its own `onCashTransactionWrite` trigger). Wired into Income, Outstanding, Purchase Orders, and Labour so cash payments are no longer invisible after the fact. Surfaced as a Cash Account card on the Bank Accounts page.
- **Fixed a real bug**: Purchase Order and Labour payments made via `bank_transfer` never wrote a `bank_transactions` row at all (only cheque-clearance and customer bank-transfer payments did) — the bank balance wasn't being decremented for immediate PO/labour bank payments. Both now debit the correct account.
- **Bank-to-bank transfers** — new Transfer Funds flow (`src/features/bank-accounts/api.ts`) writes both sides as one atomic batch sharing a `transferId`.
- **Insufficient-balance guard** — client-side pre-check on PO/Labour/Transfer forms, bypassable via the new Settings > Company > Allow Overdraft toggle (`companies/main.allowOverdraft`).
- **Multi-invoice payment allocation + overpayment handling** — `ProjectPayment.allocations[]`, derived `receivedAmount`/`outstandingAmount` on invoice docs, and a derived `Project.creditBalance` for any unallocated remainder. `ReceivePaymentModal` shows an allocation UI (auto-fill oldest-first) only when a project has open invoices, with a confirm dialog before recording anything as credit — fully backward compatible with projects that have no invoices (the original single-total behavior, unchanged).
- **Configurable VAT rate + override** — PO and Quotation forms now default VAT% from `companies/main.defaultVatPercent` instead of a hardcoded `18`; overriding it away from that default requires and stores a reason.
- Found and fixed a second real, unrelated bug while testing: Settings > Company save always failed silently whenever `logoURL` had never been set, because Firestore's `setDoc()` rejects `undefined` field values.
- Verified live against the emulator (not just code review) for every item above: cash ledger balances, an atomic two-sided bank transfer, a blocked insufficient-balance submission, a real multi-invoice allocation with a deliberate overpayment landing correctly in `creditBalance`, and the VAT default/override flow — cross-checked exact numbers via direct Firestore reads, not just the UI.

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

**All planned build work is now done.** Only two user-side steps remain before the live system is actually usable end-to-end — see below.

**Live deployment:** `watermansystem-48582` is fully deployed and live at **https://watermansystem-48582.web.app** — Hosting (latest build), Firestore rules/indexes, Storage rules, and all 9 Cloud Functions (`createUser`, `setUserRole`, `setUserActive`, `scanOverdue`, `onProjectPaymentWrite`, `onChequeStatusChange`, `onBankTransactionWrite`, `onPurchaseOrderWrite`, `onLabourPaymentWrite`). Verified with a Playwright smoke check against the live URL: login page renders correctly, zero console errors. Full authenticated smoke testing (creating real records end-to-end on production) is still blocked on the two items below.

**Still blocked on the user — not on further coding:**

- Enable the **Email/Password** sign-in provider: Firebase Console → Authentication → Sign-in method (no CLI equivalent).
- Generate a service-account key (Console → Project Settings → Service Accounts → Generate new private key) and hand over its **local file path only** (never contents) so `scripts/seedProdAdmin.mjs` can bootstrap the first real Admin login.

## 2. Hardening Pass — Done

- Firestore/Storage rules audited against the permission matrix for all 3 roles and every collection. Found and fixed one real gap: `labour_payments` create allowed `isAccountant()`, but accountants have only view access to Labour Management — only Admin/Manager should record payments (`firestore.rules`). Verified with a direct client-SDK rules test (bypassing the UI entirely) for both the fix and several other role/collection combinations, plus a live cross-role Playwright pass confirming nav visibility and route-level blocking match the matrix exactly.
- PDF exports (`src/shared/lib/exporters.ts`) now carry a company-name header, a "Generated on" timestamp, alternating row shading, and a page-number footer instead of a bare title + table. Verified by inspecting the rendered PDF output directly.
- Empty/loading states swept across every module — pages using the shared `DataTable` get this for free; the handful of custom card-based views (Debtors, Outstanding tabs, Pipeline, Documents) all already had their own inline guards. No gaps found.
- Responsive check at a 390px mobile width found and fixed a real bug: the sidebar's mobile hamburger button only shrank it to the 76px desktop icon-rail (`sidebarCollapsed`), which still ate a third of the screen and clipped page content (confirmed on the quotation wizard). Sidebar is now a proper off-canvas drawer below the `lg` breakpoint with its own `mobileSidebarOpen` state, a tap-outside backdrop, and auto-close on navigation (`src/app/Sidebar.tsx`, `src/app/Topbar.tsx`, `src/app/providers/uiStore.ts`).
- Production deploy itself surfaced one more real bug: `functions/lib` was stale (missing `index.js`/`triggers.js`, only had an old `admin.js`), which made `firebase deploy` time out trying to load the codebase. Fixed by adding a `predeploy: npm run build` hook to `firebase.json` so compiled output can never go stale again.

## 3. Remaining Work

Only the two user-blocked items above. Once those are done: run `npm run seed:prod-admin -- <email> <password> <path-to-service-account.json>` (or the equivalent documented in `scripts/seedProdAdmin.mjs`) and do a full authenticated smoke test on the live URL.

## 4. Architecture

- **Stack**: React 19 + TypeScript (strict, `erasableSyntaxOnly`) + Vite 8, Tailwind CSS v4 (CSS-first `@theme` config, `.dark` class toggle), `react-router` v8, Firebase modular SDK v9+ (Auth/Firestore/Storage/Functions), Cloud Functions v2 (Node 22, ESM).
- **Folder layout**: feature-based, `src/features/<module>/` (each with `api.ts`, page component(s), `components/`); `src/shared/` for the cross-cutting component library (`components/`), hooks (`hooks/`), and libs (`lib/firebase.ts`, `currency.ts`, `permissions.ts`, `sequence.ts`, `exporters.ts`, `timeline.ts`); `src/app/` for routing, layout shell (Sidebar/Topbar), and providers (Auth, Theme, UI store).
- **Data layer**: no TanStack Query in practice — plain custom `onSnapshot`-based hooks (`useCollection`, `useDocument` in `src/shared/hooks/`) are the live data layer. Zustand is UI-state only (theme, sidebar collapse) and never mirrors Firestore data.
- **Forms**: `react-hook-form` + `zod`, one schema per entity.
- **Charts**: `recharts`, palette fixed per the `dataviz` skill (income green `#16a34a`, expenses red `#dc2626`).
- **PDF/Excel export**: `pdfmake` + `xlsx`, isolated in `src/shared/lib/exporters.ts` and **dynamically imported** on click only (keeps the ~2MB Roboto font payload out of the main bundle).
- **Firestore data model** — ~19 collections; the key modeling decision is that **Quotations, Business Pipeline, and Outstanding are three views over one lifecycle**, not three data stores: a `quotations` doc (Draft→Submitted→Approved/Rejected) spawns a `projects` doc on approval, which both the Pipeline board and Outstanding module read/write for the rest of its life (PO Received → Advance Received → Active → Invoiced → Done). Full collection table lives in the build plan at `C:\Users\thari\.claude\plans\real-world-flow-customer-requests-indexed-wozniak.md` (§ Firestore Data Model) if a refresher is ever needed.
- **Derived/aggregate fields are Cloud-Functions-only**, never client-writable: `projects.receivedAmount/outstandingAmount/creditBalance`, `suppliers.outstandingBalance`, `construction_sites.spentToDate`, `bank_accounts.currentBalance`, `cash_accounts/main.currentBalance`, `labour.outstandingBalance/totalPaidAllTime`, and per-invoice `project_documents.receivedAmount/outstandingAmount`. Enforced two ways: (1) Firestore rules explicitly block client writes to these field names via an `unchanged([...])` helper (or deny writes outright, e.g. `cash_accounts`), (2) the only code path that touches them is `functions/src/triggers.ts` (`onProjectPaymentWrite`, `onChequeStatusChange`, `onBankTransactionWrite`, `onCashTransactionWrite`, `onPurchaseOrderWrite`, `onLabourPaymentWrite`, `scanOverdue`), running under the Admin SDK which bypasses rules entirely.
- **Cash ledger** mirrors the bank ledger exactly (`cash_accounts/main` singleton + append-only `cash_transactions`), so cash payments across Income/Outstanding/PO/Labour are as auditable as bank payments. **Bank transfers** are two ordinary `bank_transactions` docs (debit + credit) sharing a `transferId`, written in one atomic batch — no separate trigger needed since each side rebalances its own account independently. **Payment allocation**: a `ProjectPayment` carries an `allocations[]` array (invoice → amount); when empty (the common case — no open invoices yet), a payment applies to the project total exactly as it always has. Any amount a payment doesn't allocate becomes `Project.creditBalance`, never silently folded into another invoice's balance.
- **Sequence numbers** (`QTN-2026-0001`, `PO-2026-0003`, `RCP-2026-0001`) are generated client-side via Firestore transactions (`src/shared/lib/sequence.ts`) against `counters/{name}` docs — a deliberate, judged-safe deviation from doing it in Cloud Functions, since these are display references, not money-bearing fields.
- **Auth/permissions**: role (`admin | accountant | manager`) stored as a Firebase Auth custom claim (checked in Firestore rules via `request.auth.token.role`) and mirrored into `users/{uid}.role` for UI reads. The UI's own permission checks (`src/shared/lib/permissions.ts`) read the Firestore doc field, not the token claim — a nuance to remember if the two ever need to be kept in sync differently.
- **Environments**: `.env` (gitignored) = emulator config, used by `npm run dev`. `.env.production` (gitignored) = real `watermansystem-48582` Firebase web config + `VITE_USE_FIREBASE_EMULATORS=false`, picked up automatically by `vite build`. `.firebaserc` has `default: demo-waterman-erp` (emulators) and `prod: watermansystem-48582` (used via explicit `--project` flag on deploy commands).

## 5. Currently Hardcoded Values — What & How to Remove

| What | Where | How to fix later |
|---|---|---|
| Dev-only Admin bootstrap credentials | `scripts/seedAdmin.mjs` (`admin@waterman.lk` / `Admin@12345` + a placeholder company profile) | Intentional, emulator-only convenience. `scripts/seedProdAdmin.mjs` already requires explicit email/password/service-account-path args with no defaults — never reuse the emulator defaults in production. |
| Dashboard greeting always says "Good morning" | `src/features/dashboard/DashboardPage.tsx:20` | Compute from `today.getHours()` (e.g. <12 morning, <18 afternoon, else evening) instead of a fixed string. Cosmetic only. |
| Payment-method option lists duplicated per form | `POFormPanel.tsx`, `ReceivePaymentModal`, `AddIncomeModal` each define their own local array | Consolidate into one shared constant (e.g. `src/shared/lib/paymentMethods.ts`) and import everywhere. Not urgent — lists are currently in sync by coincidence, not by shared source. |
| Product/quotation category & unit lists | `PRODUCT_CATEGORIES` / `PRODUCT_UNITS` in `src/features/products/api.ts`, quotation categories in `src/features/pipeline/schema.ts` | Fine for v1. If the business later wants to manage these themselves, move to a Settings-editable Firestore doc (e.g. `companies/main.categories`) instead of a hardcoded array. |
| Currency fixed to LKR | `src/shared/lib/currency.ts` (`Intl.NumberFormat('en-LK', { currency: 'LKR' })`) | Intentional single-currency scope for this business. Only revisit if multi-currency support is ever requested — would need a currency field per transaction, not just a formatting change. |
| `scanOverdue` scheduled Cloud Function | `functions/src/triggers.ts` | Never exercised locally (no Pub/Sub emulator support) — verified by code review only. Confirm it actually fires correctly once deployed to production (check Cloud Scheduler logs after the first scheduled run). |
| Reports date ranges fixed to 3 presets | `src/features/reports/api.ts` (`REPORT_RANGES`: This Month / Last 3 Months / All Time) | No custom date-range picker yet. Add one later if the business wants an arbitrary start/end date instead of the 3 presets. |

## 6. Deferred Backlog (from the Phase 2 checklist)

Explicitly out of scope for now — the user's own guidance was one module at a time, not everything in one pass:

- **Full multi-tenancy** — `companyId` scoping across every collection/rule/query. Deferred since there's one real company today; revisit if/when a second company actually signs on, since retrofitting is a large, mechanical rework (every collection, every rule, every query).
- **5-role model** — add Site Manager and Viewer to the current Admin/Accountant/Manager, plus the matching `src/shared/lib/permissions.ts` matrix and `firestore.rules` rework.
- **Debtors module**: aging buckets (Current/1-30/31-60/61-90/90+), a follow-up/reminder log, customer statement export (opening/invoices/payments/closing balance, date-wise).
- **Supplier Management**: duplicate-detection warning on Add Supplier (same TIN/email/phone), a "Save & Create Purchase Order" flow.
- **Reports & Analytics**: dedicated PO/Bank/Payment report tabs beyond the current 8, and monthly-aggregate caching if the collections grow large enough that client-side aggregation (documented as "fine at this data scale" since the original build) stops being fine.
