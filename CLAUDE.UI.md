# UI Design Context — Money Tracker

> **Mục đích**: File này là context input cho session Claude redesign UI. Tất cả claim đều có `file:line` reference. Không sửa code; chỉ document hiện trạng + đề xuất hướng.
>
> **Sinh ra từ**: phân tích `src/` ngày 2026-04-30. Khi code thay đổi nhiều, refresh lại file này trước khi redesign.

---

## 1. Frontend Tech Stack

Source: `package.json:13-40`

- **Framework**: React `^19.0.0` (`package.json:24-25`)
- **Build**: Vite `^6.2.0` + `@vitejs/plugin-react ^5.0.4` (`package.json:17,28`)
- **Styling**: Tailwind CSS `^4.1.14` qua plugin `@tailwindcss/vite ^4.1.14` (`package.json:15,36`, `vite.config.ts:1,9`)
  - **KHÔNG** dùng `tailwind.config.js` truyền thống — Tailwind v4 chuyển sang `@theme` block trong CSS (`src/index.css:6-8`)
  - Custom variant cho dark mode: `@custom-variant dark (&:where(.dark, .dark *))` (`src/index.css:4`)
- **Server state**: `@tanstack/react-query ^5.90.21` (`package.json:16`, `src/main.tsx:3,11-21`)
  - Global config: `staleTime 30s`, `gcTime 5m`, `refetchOnWindowFocus: false`, retry 2 (`src/main.tsx:12-21`)
- **Icons**: `lucide-react ^0.546.0` (`package.json:22`) — dùng ở mọi component
- **Charts**: `recharts ^3.7.0` (`package.json:26`) — `BarChart`, `PieChart` (`IncomeExpenseChart.tsx:2-11`, `ExpenseStructureChart.tsx:2`)
- **Animation**: `motion ^12.23.24` (Framer Motion successor) (`package.json:23`) — **chưa dùng** ở bất kỳ file nào (tìm `import.*motion` → 0 hit)
- **Class merging**: `clsx ^2.1.1` + `tailwind-merge ^3.5.0` qua helper `cn()` (`src/lib/utils.ts:1-6`)
- **Routing**: KHÔNG có lib router. Switch view bằng `useState<string>('overview')` + chuỗi `if` (`src/App.tsx:17,41-46`)
- **Forms**: KHÔNG có lib (no react-hook-form, no formik, no zod). Tất cả dùng `useState` + handler thủ công (`src/views/Goals.tsx:68-87`, `src/views/Jars.tsx:71-90`)
- **Font**: Inter qua Google Fonts CDN (`src/index.css:1`), khai báo `--font-sans` (`src/index.css:7`)
- **Dependencies thừa cần review**:
  - `@google/genai ^1.29.0` (`package.json:14`) — không tìm thấy import nào trong `src/`
  - `better-sqlite3`, `express`, `dotenv` (`package.json:18,21,20`) — backend deps trong package frontend?

---

## 2. Current Design System

### 2.1 Colors

**Design tokens (CSS variables)** — định nghĩa duy nhất ở `src/index.css:14-66`:

| Token | Light | Dark | Mục đích |
|---|---|---|---|
| `--color-income` | `#16a34a` | `#4ade80` | Thu nhập |
| `--color-income-bg` | `#dcfce7` | `rgba(74,222,128,.14)` | Bg badge thu |
| `--color-expense` | `#dc2626` | `#fb7185` | Chi tiêu |
| `--color-expense-bg` | `#fee2e2` | `rgba(251,113,133,.14)` | Bg badge chi |
| `--color-transfer` | `#2563eb` | `#60a5fa` | Chuyển khoản |
| `--color-surface` | `#ffffff` | `#1a2433` | Card/panel bg |
| `--color-surface-alt` | `#f8fafc` | `#131b28` | Page bg |
| `--color-surface-raised` | `#ffffff` | `#1e2b3a` | Modal/raised |
| `--color-border` | `#e2e8f0` | `#2d3d50` | Border chính |
| `--color-text-primary` | `#0f172a` | `#eaeef3` | Text headline |
| `--color-text-secondary` | `#475569` | `#b8c4d1` | Text body |
| `--color-text-muted` | `#64748b` | `#8d9bae` | Text caption |

**Vấn đề**: tokens được định nghĩa nhưng **gần như không được consume** trong components. Code dùng class Tailwind raw + override class trong `.dark` (`src/index.css:69-309`).

**Hardcoded hex colors trong JSX**: 77 occurrences trong 12 files (verified bằng grep `bg-\[#[0-9a-fA-F]+\]|text-\[#[0-9a-fA-F]+\]`):
- `src/views/Debts.tsx`: 21
- `src/views/Jars.tsx`: 16
- `src/views/BudgetPlan.tsx`: 12
- `src/views/Transactions.tsx`: 8
- `src/views/Overview.tsx`: 7
- `src/components/IncomeExpenseChart.tsx`: 3, `TopBar.tsx`: 3
- Examples: `bg-[#1a2433]` (`Overview.tsx:102`), `bg-[#0c1222]` (`App.tsx:31`, `TopBar.tsx:74`), `bg-[#151b2b]` (`Overview.tsx:179`)

**Jar color systems — 3 bảng KHÁC NHAU cho cùng 6 keys** (`NEC, EDU, LTSS, PLAY, FFA, GIVE`):

| Jar | `ExpenseStructureChart.tsx:9-16` | `Jars.tsx:40-47` | `BudgetPlan.tsx:59-66` |
|---|---|---|---|
| NEC | `#38bdf8` (sky-400) | `bg-sky-500` | `text-blue-600` (xanh khác) |
| EDU | `#a78bfa` (violet-400) | `bg-violet-500` | `text-purple-600` (tím khác) |
| LTSS | `#34d399` (emerald-400) | `bg-emerald-500` | `text-teal-600` (teal — màu khác hẳn) |
| PLAY | `#fb923c` (orange-400) | `bg-orange-500` | `text-pink-600` (HỒNG — sai hoàn toàn) |
| FFA | `#fbbf24` (amber-400) | `bg-amber-500` | `text-green-600` (XANH LÁ — sai hoàn toàn) |
| GIVE | `#f472b6` (pink-400) | `bg-pink-500` | `text-amber-600` (vàng — sai hoàn toàn) |

→ User chuyển page sẽ thấy hũ "PLAY" lúc cam, lúc hồng. Đây là bug nhận diện thương hiệu nghiêm trọng.

### 2.2 Typography

- **Font family**: Inter (Google Fonts) — `src/index.css:1`, declared as `--font-sans` (`src/index.css:7`)
- **Font weights dùng**: 400, 500, 600, 700 (`src/index.css:1`)
- **Heading scale** (quan sát từ JSX, không có scale chính thức):
  - Page title `h2`: `text-3xl font-bold tracking-tight` (`Transactions.tsx:106`, `Jars.tsx:302`)
  - Section heading `h3`: `text-lg font-bold` (`Overview.tsx:148`, `Jars.tsx:493`) HOẶC `text-xl font-bold` (`TransactionDetails.tsx:38`)
  - Card title: `text-base font-semibold` (`Jars.tsx:406`)
  - Meta caption: `text-xs uppercase tracking-wider` (`TransactionDetails.tsx:59,87`)
- **KHÔNG có scale system** — mỗi view tự chọn size. Cùng cấp heading có khi `text-lg`, có khi `text-xl`, có khi `text-2xl`.

### 2.3 Spacing & Layout

- **Container width**: `max-w-7xl mx-auto` lặp ở: `App.tsx:40`, `Overview.tsx:80`, `Transactions.tsx:103`, `Jars.tsx:298`, `Goals.tsx:675`. **Không trừu tượng hoá** — mỗi view tự khai báo.
- **Page horizontal padding**: `px-4 md:px-8` (`App.tsx:40`) hoặc `px-4 md:px-6` (`TopBar.tsx:32`) — không nhất quán.
- **Card pattern**: `bg-white dark:bg-[#1a2433] rounded-xl p-{4-6} border border-slate-{100,200} dark:border-slate-{700,800} shadow-sm` — lặp lại ~30+ lần (xem `Overview.tsx:102,147`, `Transactions.tsx:115,193`, `Jars.tsx:334,343,352,361,394`).
- **Border radius**: trộn `rounded-lg` (form fields, buttons), `rounded-xl` (cards), `rounded-2xl` (modal — `Goals.tsx:91,256`, `Jars.tsx:94`), `rounded-full` (badges, avatars).
- **Grid pattern phổ biến**: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` cho summary cards (`Overview.tsx:98`, `Transactions.tsx:114`, `Goals.tsx:728`).

### 2.4 Component Inventory

| Component | File | Dùng ở | Ghi chú |
|---|---|---|---|
| `TopBar` | `src/components/TopBar.tsx` (174 dòng) | `App.tsx:7,32` | Nav + month selector + dark toggle + budget status strip. **Active**. |
| `TransactionDetails` | `src/components/TransactionDetails.tsx` (179 dòng) | `Transactions.tsx:6,364` | Right drawer, không dùng portal. Dark mode hỗ trợ một phần (`l.36` thiếu `dark:bg-*`). |
| `IncomeExpenseChart` | `src/components/IncomeExpenseChart.tsx` (313 dòng) | `Overview.tsx:138` | Bar chart. Tự xử lý dark/light qua `useDarkMode()`. |
| `ExpenseStructureChart` | `src/components/ExpenseStructureChart.tsx` (137 dòng) | `Overview.tsx:141` | Donut chart. JAR_COLORS riêng. |
| `Header` | `src/components/Header.tsx` (70 dòng) | **0 imports** (verified `grep -r "import.*Header"`) | **DEAD CODE**. Có avatar, search, bell, không dark mode. |
| `Sidebar` | `src/components/Sidebar.tsx` (62 dòng) | **0 imports** | **DEAD CODE**. Có route "Tài khoản & Chuyển khoản" không tồn tại. |
| `JarStats` | `src/views/JarStats.tsx` (121 dòng) | `Jars.tsx:6,374` | View con render chart per-jar. Tên file ở `views/` nhưng thực chất là component. |
| `App` | `src/App.tsx` (50 dòng) | entry | View routing bằng string-conditional. |

**Components TỰ-IN-LINE (đáng lẽ phải tách)**:
- `CreateGoalForm` (`Goals.tsx:64-216`), `EditGoalForm` (`Goals.tsx:220-418`), `ContributeForm` (`Goals.tsx:422-519`), `GoalDetailPanel` (`Goals.tsx:523-605`), `SummaryCard` (`Goals.tsx:885-898`)
- `CreateFundForm` (`Jars.tsx:67-206`)
- `DebtCard` (`Debts.tsx:20-143`), `CreateDebtForm` (`Debts.tsx:147+`), v.v...
- `EditablePercent` (`BudgetPlan.tsx:259-316`), `JarDrillDown` (`BudgetPlan.tsx:320-360`), `PlannedExpenseForm` (`BudgetPlan.tsx:377+`), `StatusBadge` (`BudgetPlan.tsx:232-255` và `Goals.tsx:42-50` — **trùng tên, hai impl khác nhau**)

**Đo lường monolithic** (lệnh `wc -l`):
- `BudgetPlan.tsx`: **1590 dòng** ← critical, cần tách
- `Goals.tsx`: **898 dòng**
- `Jars.tsx`: **573 dòng**
- `Debts.tsx`: **451 dòng**
- `Transactions.tsx`: **368 dòng**
- `IncomeExpenseChart.tsx`: 313 dòng

**KHÔNG có UI primitives** — không có `<Button>`, `<Input>`, `<Modal>`, `<Card>`, `<Badge>` dùng chung. Tất cả tự viết Tailwind class wall.

### 2.5 Icons & Assets

- **Lib**: `lucide-react` import-named từng icon, không tree-shake issues
- **Icons phổ biến**: `Loader2` (loading spinner — 8 file), `X` (close button), `ChevronDown/Up`, `Plus`, `Wallet`, `Calendar`, `AlertCircle/Triangle`, `CheckCircle2`
- **Favicon**: emoji 💰 inline SVG trong `index.html:6`
- **Avatar**: hardcode placeholder `https://i.pravatar.cc/150?img=68` ở `Header.tsx:64` (dead code, nhưng rõ ràng app chưa có user/auth UI thật)
- **KHÔNG có**: logo SVG, illustration, empty state graphics. Empty states dùng icon Lucide cỡ to (`Goals.tsx:744-756`).

---

## 3. Architecture

### 3.1 Routes & Views

Switch view dựa trên `currentView: string` trong `App.tsx:17,41-46`:

| `currentView` value | Component | Label (vi) | File |
|---|---|---|---|
| `overview` | `Overview` | Tổng quan | `src/views/Overview.tsx` |
| `transactions` | `Transactions` | Giao dịch | `src/views/Transactions.tsx` |
| `jars` | `Jars` | Quản lý Hũ | `src/views/Jars.tsx` (có sub-tab `list` / `stats` ở `l.209`) |
| `budget` | `BudgetPlan` | Chi tiêu | `src/views/BudgetPlan.tsx` |
| `goals` | `Goals` | Quỹ & Mục tiêu | `src/views/Goals.tsx` |
| `debts` | `Debts` | Nợ | `src/views/Debts.tsx` |

Nav items định nghĩa ở `TopBar.tsx:21-28`. **Không có URL persistence** — refresh = về `overview`.

### 3.2 Component Hierarchy

```
<StrictMode> (main.tsx:24)
  <QueryClientProvider> (main.tsx:25)
    <App> (App.tsx:16)
      <TopBar> (App.tsx:32)
        ├── nav buttons (desktop + mobile)
        ├── <select> month picker
        ├── dark mode toggle
        └── BudgetStatusStrip (when data)
      <main>
        └── <{Overview | Transactions | Jars | BudgetPlan | Goals | Debts}>
            (selected by string match, App.tsx:41-46)
```

Mỗi view nhận prop `month: string`. State `selectedMonth` và `darkMode` ở `App.tsx:18-23`. **Không có Context** — props drilling chưa sâu.

### 3.3 State Management

- **Server state**: TanStack Query — toàn bộ qua `src/lib/hooks.ts` (768 dòng, 50+ hooks)
- **UI state**: `useState` thuần ở mỗi view
- **Persisted UI state**: chỉ `darkMode` qua `localStorage` (`App.tsx:19-28`)
- **Dark mode reactivity**: hook `useDarkMode()` (`hooks.ts:755-767`) dùng `MutationObserver` watch class `dark` trên `documentElement` — pattern OK nhưng nặng cho mỗi component.
- **KHÔNG có**: Redux, Zustand, Jotai, Context API. Phù hợp với kích thước app hiện tại.

### 3.4 API Integration

Base URL: `/api` (`src/lib/api.ts:50`). Vite proxy `/api → http://localhost:8000` (`vite.config.ts:22-26`).

⚠️ **Lưu ý**: `CLAUDE.md:75-79` ghi base là `/api/v1/` nhưng `api/routes/api.php` thực tế dùng `/api/{resource}` (không có `/v1/`). Verified ở `api/routes/api.php:121-247`. → CLAUDE.md cần fix.

**ETag caching**: `smartFetch()` (`src/lib/api.ts:62-89`) — dùng `If-None-Match` header, cache theo URL trong `Map`. 304 → trả cached body. Đây là tối ưu hay, cần preserve khi redesign.

**API surface** (verified `api/routes/api.php`):
- Read endpoints: `/dashboard/summary`, `/sync-status`, `/transactions`, `/transactions/{key}`, `/budget-plan`, `/budget-status`, `/budget-settings/{month}`, `/jars`, `/accounts`, `/accounts/net-worth`, `/budget-periods`, `/budget-periods/{id}/lines`, `/goals`, `/debts`, `/recurring-bills`, `/transfers`, `/funds`, `/investment-summary`, `/scenarios`
- Write endpoints (under `throttle:write` middleware, `api.php:195`): POST/PUT/DELETE cho mỗi resource, plus actions như `/goals/{id}/contribute`, `/funds/{id}/reserve`, `/budget-periods/{id}/allocate`

API client function ↔ hook:
| API call (`api.ts`) | Hook (`hooks.ts`) | Used by view |
|---|---|---|
| `fetchDashboardSummary` | `useDashboardSummary` | `Overview.tsx:21` |
| `fetchTransactions` | `useTransactions` | `Transactions.tsx:96`, `Jars.tsx:215`, `BudgetPlan.tsx:321` |
| `fetchBudgetPlan` | `useBudgetPlan` | `BudgetPlan.tsx:23` |
| `fetchBudgetStatus` | `useBudgetStatus` | `TopBar.tsx:19`, `Overview.tsx:24`, `Transactions.tsx:62`, `Jars.tsx:216`, `BudgetPlan.tsx:27` |
| `fetchGoals` | `useGoals` | `Goals.tsx:619` |
| `fetchDebts` | `useDebts` | `Debts.tsx`, `BudgetPlan.tsx:34` |
| `fetchFunds` | `useFunds` | `Jars.tsx:217`, `BudgetPlan.tsx:35` |
| `fetchJars` | `useJars` | `Jars.tsx (CreateFundForm)`, `Goals.tsx:65`, `BudgetPlan.tsx:25` |

---

## 4. User Flows

**Flow chính** (verified từ App + views):

1. **App init** (`App.tsx:16-31`)
   - Load → đọc `darkMode` từ localStorage hoặc `prefers-color-scheme` → set `currentView='overview'` + `selectedMonth=getCurrentMonth()`
   - Render `<TopBar>` + `<Overview>`

2. **Overview** (`Overview.tsx`)
   - `useDashboardSummary(month)` polling 60s (`hooks.ts:91`)
   - `useBudgetStatus(month)` + `useInvestmentSummary(month)`
   - 5 summary cards (4 white + 1 gradient blue-600→blue-800 ở `l.115`)
   - 2 charts side-by-side: IncomeExpense (3 cols) + ExpenseStructure (2 cols)
   - Budget jar breakdown grid (6 jars)
   - Investment progress section (conditional)
   - Recent transactions list (5-10 rows)
   - User click "Làm mới" → trigger `useTriggerSync()` → invalidate caches

3. **Transactions** (`Transactions.tsx`)
   - 4 summary cards
   - Search input (debounce 400ms ở `l.80-85`) + flow tabs (Tất cả / Thu / Chi / Chuyển)
   - Desktop: `<table>` 7 cột (`l.196-207`); Mobile: `<div>` list (`l.277`)
   - Click row → `setSelectedTx` → render `<TransactionDetails>` drawer
   - Pagination cuối bottom (`l.311`)

4. **Jars** (`Jars.tsx`)
   - Tab `list` / `stats` (`l.209`)
   - 4 summary cards (Kế hoạch / Cam kết / Đã chi / Còn lại)
   - 6 jar rows với progress bar + drilldown panel bên phải khi select
   - "Tạo quỹ con" button → modal `<CreateFundForm>` (`l.299`)
   - Stats tab → `<JarStats>` với BarChart

5. **BudgetPlan** (`BudgetPlan.tsx`, 1590 lines — flow phức tạp nhất)
   - Multi-section: jar planner, line items, allocation, period management
   - Editable percent inline (`l.259`)
   - Drill-down per jar (`l.320`)
   - PlannedExpenseForm cho từng line type (general/goal/debt/bill/sinking_fund/investment)

6. **Goals** (`Goals.tsx`)
   - Filter (active/completed/paused) + sort (deadline/priority/amount)
   - Summary cards
   - Goal cards với progress bar, expand inline, contribute form inline
   - Modals: Create, Edit (`l.220`), Detail drawer (`l.872`)

7. **Debts** (`Debts.tsx`)
   - DebtCard list với progress + payment history expand
   - Modals: Create, Pay

**Cross-page coupling**:
- TopBar's BudgetStatusStrip (`TopBar.tsx:128-170`) hiện ở mọi page khi `useBudgetStatus` có data → 4 stats luôn ở header
- `selectedMonth` propagate từ `App` → mọi view qua prop drilling

---

## 5. Pain Points (Evidence-Based)

### P1. **Design tokens định nghĩa nhưng không dùng** — Critical
- **Evidence**: `src/index.css:14-66` định nghĩa 20+ CSS variables (`--color-income`, `--color-surface`, v.v.) nhưng grep `var\(--color-` trong `src/` chỉ ra 0 usage trong file `.tsx`. Chỉ `index.css:113-148` consume.
- **Impact**: Component hardcode `text-green-600`, `text-blue-600`, `bg-[#1a2433]` thay vì `text-[var(--color-income)]`. Đổi brand color = phải sửa hàng trăm chỗ.

### P2. **3 jar color palettes mâu thuẫn** — Critical (UX bug)
- **Evidence**:
  - `src/components/ExpenseStructureChart.tsx:9-16` (sky/violet/emerald/orange/amber/pink — hex)
  - `src/views/Jars.tsx:40-47` (sky/violet/emerald/orange/amber/pink — Tailwind classes)
  - `src/views/BudgetPlan.tsx:59-66` (blue/purple/teal/**pink**/green/amber — hoàn toàn khác)
- **Impact**: Hũ "PLAY" khi xem ở Overview chart là **cam**, sang BudgetPlan là **hồng**. Hũ "FFA" khi ở Jars là **amber**, sang BudgetPlan là **green**. Người dùng không nhận diện được hũ nhất quán.

### P3. **Dead code component `Header` + `Sidebar`** — Cleanup
- **Evidence**: `grep -r "import.*Header\|import.*Sidebar" src/` → 0 results. Chỉ `App.tsx` import `TopBar`.
- **Impact**: 132 dòng code chết (`Header.tsx` 70 + `Sidebar.tsx` 62). Misleading khi đọc structure.

### P4. **BudgetPlan.tsx 1590 dòng monolithic** — High
- **Evidence**: `wc -l src/views/BudgetPlan.tsx` → 1590. So sánh với `Overview.tsx` (275) và `JarStats.tsx` (121).
- **Sub-components in-line**: `StatusBadge` (`l.232`), `EditablePercent` (`l.259`), `JarDrillDown` (`l.320`), `PlannedExpenseForm` (`l.377`), v.v.
- **Impact**: Không thể test isolated; HMR slow; khó onboard người mới; merge conflict cao.

### P5. **Form pattern duplicate ~33 lần** — Medium
- **Evidence**: grep `rounded-lg border border-slate-300` → 33 occurrences ở `Goals.tsx`, `Jars.tsx`, `Debts.tsx`. Mỗi form input self-style:
  ```tsx
  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  ```
  Ví dụ: `Goals.tsx:107,125,135,152,162,176,190` (7 input trong 1 form, 7 lần copy class wall).
- **Impact**: Mọi thay đổi style form (vd: thay focus color) phải sửa 33 chỗ.

### P6. **Primary button pattern duplicate ~9 lần** — Medium
- **Evidence**: grep `bg-blue-600 hover:bg-blue-700` → 9 occurrences ở `Goals.tsx`, `Jars.tsx`, `Debts.tsx`. Examples: `Goals.tsx:202,718,750`, `Jars.tsx:197,308`.
- **Impact**: Tương tự P5. Không có `<Button variant="primary">`.

### P7. **Modal overlay pattern duplicate 6 lần** — Medium
- **Evidence**: grep `fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50` → 6 occurrences ở `Goals.tsx:90,255,873`, `Debts.tsx:183,274`, `Jars.tsx:93`. Mỗi modal tự render overlay + container, không qua portal.
- **Impact**: Z-index hell tiềm ẩn (TopBar đang `z-50` ở `TopBar.tsx:31`); a11y khó (focus trap thiếu hết).

### P8. **`window.alert/confirm` thay cho UX modal** — High (UX)
- **Evidence**:
  - `Goals.tsx:446`: `alert(msg)` sau contribute
  - `BudgetPlan.tsx:704`: `window.confirm(\`Xóa khoản dự kiến...\`)`
  - `BudgetPlan.tsx:1109`: `alert(\`Chưa phân bổ hết...\`)`
  - `Debts.tsx:439`: `confirm('Xóa khoản nợ này?')`
- **Impact**: UX 1990s, không brand, không dismissible programatically, không stacking.

### P9. **A11y thiếu gần như hoàn toàn** — High
- **Evidence**: grep `aria-|alt=|role=|tabIndex|onKeyDown` → chỉ **7 hits ở 1 file** (`BudgetPlan.tsx`). 6/7 view files có 0 a11y attributes.
- **Issues cụ thể**:
  - Modals không có `role="dialog"`, không `aria-modal`, không focus trap (`Goals.tsx:90`, `Jars.tsx:93`)
  - Buttons icon-only không `aria-label` (vd: `Header.tsx:53,57` — bell, search; `TransactionDetails.tsx:39` — close)
  - Charts không alt-text/`aria-describedby` (`IncomeExpenseChart.tsx:274`, `ExpenseStructureChart.tsx:99`)
  - Custom dropdown (`<select>` natural, OK) nhưng overlay `ChevronDown` + `pointer-events-none` (`TopBar.tsx:80`) nếu replace bằng custom div → cần trap key
  - Color-only state (status dot ở `Transactions.tsx:264-268` chỉ phân biệt qua màu xanh/vàng/xám)

### P10. **Dark mode override CSS approach mong manh** — Medium
- **Evidence**: `src/index.css:69-309` có ~120 dòng `.dark .bg-slate-50 { ... }` overrides — patch từng class Tailwind sang giá trị custom.
- **Impact**: Mỗi class Tailwind mới user dùng (vd: `bg-slate-150`) sẽ KHÔNG có dark variant tự động. Phải append vào `.css`. Cách Tailwind v4 idiomatic là dùng `dark:bg-{color}` per-element — code đã làm 1 phần (`Overview.tsx:102 "bg-white dark:bg-[#1a2433]"`), nên 2 hệ thống đang cùng tồn tại.

### P11. **No empty/error/loading skeleton system** — Medium
- **Evidence**: Loading dùng `<Loader2 className="animate-spin">` ở center of page (`Overview.tsx:30`, `Transactions.tsx:181`, `Goals.tsx:651`). Empty states ad-hoc text (`Goals.tsx:744-756` — có illustration; `Transactions.tsx:189` — chỉ text). Error: alert-style banner (`Transactions.tsx:172`, `Goals.tsx:660`).
- **Impact**: Nhảy layout (CLS) khi data load. UX không nhất quán.

### P12. **CLAUDE.md sai về API base URL** — Low (documentation)
- **Evidence**: `CLAUDE.md:75-79` ghi `Base URL: /api/v1/`, nhưng `api/routes/api.php` không có prefix `v1`. `src/lib/api.ts:50` dùng `const BASE = '/api'`.
- **Impact**: Misleading khi onboard.

### P13. **Mobile responsiveness gaps** — Medium
- **Evidence**:
  - `Transactions.tsx:195` desktop table `hidden md:block` + mobile list `md:hidden` — duplicate render logic
  - `Header.tsx:46-50` search input `hidden md:flex` — search bị ẩn hoàn toàn ở mobile, chỉ còn icon (`l.53-55`) không có UX expand
  - `Jars.tsx:486` panel detail `lg:w-[400px] sticky top-6` — mobile flow chưa tối ưu (chiếm full width sau jar list)
  - BudgetStatusStrip (`TopBar.tsx:131`) `overflow-x-auto` — scroll ngang ở mobile, không indicator

### P14. **Inter font qua CDN** — Low (perf)
- **Evidence**: `src/index.css:1` `@import url('https://fonts.googleapis.com/...')` — block render đến khi CSS download.
- **Impact**: ~100ms FCP delay; offline preview fail.

---

## 6. Constraints cho Redesign

### Phải giữ
- **API contract** unchanged (`api/routes/api.php` + `src/lib/types.ts` định nghĩa 50+ endpoints; backend Laravel 11 stabilized)
- **TanStack Query setup** (`main.tsx:11-21`): staleTime, ETag pattern (`api.ts:62-89`) — đây là phần performance chín muồi
- **Vietnamese language** (`index.html:2 lang="vi"`, mọi label tiếng Việt) — tệp ngôn ngữ chưa tách, redesign giữ nguyên hardcoded vi-VN trừ khi thêm i18n
- **Dark mode toggle** + persistence (`App.tsx:19-28`) — user-facing feature
- **6-jar system** (NEC, EDU, LTSS, PLAY, FFA, GIVE) — domain logic core, không đổi taxonomy
- **Currency format**: `formatCurrency(value)` (`utils.ts:16-36`) trả "1,2 M VND" / "200k VND" — UI phụ thuộc nặng

### Có thể đổi
- Toàn bộ component layer (zero shared primitives hiện tại — không có lock-in)
- Routing approach (string switch → react-router hoặc TanStack Router)
- Dark mode strategy (override-CSS → utility-class only)
- Form library (vanilla useState → react-hook-form + zod)
- Chart styling (recharts giữ, nhưng colors/tooltips/legend có thể standardize)

### Brand identity
- **Primary blue**: `#2563eb` (light) / `#60a5fa` (dark) — `--color-transfer` ở `index.css:23,49`
- **Accent on Overview gradient card**: `from-blue-600 to-blue-800` (`Overview.tsx:115`)
- **Logo**: emoji 💰 trong rounded-lg `bg-blue-600 text-white` (`TopBar.tsx:38`, `Sidebar.tsx:18`)
- **App title**: "AL Money Tracker" (`index.html:7`), in-app "Money Tracker" + "Quản lý tài chính" (`Sidebar.tsx:22-23`)

### Mobile-first hay desktop-first?
- Codebase hiện viết **desktop-first** với mobile fallback (vd: `Transactions.tsx:195-274` tách 2 render). Đề xuất chuyển sang **mobile-first** cho redesign vì: TopBar đã có mobile menu (`TopBar.tsx:103-125`), summary cards đã `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — nền tảng đã có.

---

## 7. Redesign Direction Suggestions

### S1. **Extract design system primitives** — phải làm trước, mọi thứ khác build trên đây
**Scope**: Tạo `src/components/ui/` (theo style shadcn/ui, không cần lib) gồm:
- `<Button variant="primary|secondary|ghost|danger" size="sm|md|lg">` — thay 9 chỗ `bg-blue-600 hover:bg-blue-700` (`Goals.tsx:202,718,750`, `Jars.tsx:197,308`, `Debts.tsx:106`...)
- `<Input>`, `<Select>`, `<Textarea>` — thay 33 chỗ `rounded-lg border border-slate-300 px-3 py-2`
- `<Card>` + `<CardHeader>` + `<CardBody>` — thay pattern lặp `bg-white dark:bg-[#1a2433] rounded-xl p-6 border ... shadow-sm`
- `<Modal>` qua React portal + focus trap + escape handler — thay 6 chỗ `fixed inset-0 bg-slate-900/30 backdrop-blur-sm` (`Goals.tsx:90,255,873`, `Jars.tsx:93`, `Debts.tsx:183,274`)
- `<Badge variant="income|expense|transfer|warn|ok|over">`, `<ProgressBar>`, `<Skeleton>`
**Tại sao**: P1, P5, P6, P7 đều tan biến. Mỗi view sau khi migrate giảm 30-40% LOC.

### S2. **Centralize jar identity** — fix UX bug nghiêm trọng
**Scope**: Tạo `src/lib/jars.ts` export 1 nguồn duy nhất:
```ts
export const JARS = {
  NEC:  { label: 'Thiết yếu',   hex: '#38bdf8', tw: 'sky',     icon: Home },
  EDU:  { label: 'Giáo dục',    hex: '#a78bfa', tw: 'violet',  icon: BookOpen },
  LTSS: { label: 'Tiết kiệm',   hex: '#34d399', tw: 'emerald', icon: PiggyBank },
  PLAY: { label: 'Hưởng thụ',   hex: '#fb923c', tw: 'orange',  icon: PartyPopper },
  FFA:  { label: 'Tự do TC',    hex: '#fbbf24', tw: 'amber',   icon: TrendingUp },
  GIVE: { label: 'Cho đi',      hex: '#f472b6', tw: 'pink',    icon: Gift },
} as const;
```
Xóa 3 bảng cũ (`ExpenseStructureChart.tsx:9`, `Jars.tsx:40,49`, `BudgetPlan.tsx:59`). Tất cả component import từ đây.
**Tại sao**: P2 fix; P12 fix một phần (consistent identity).

### S3. **Tách BudgetPlan.tsx thành module** — Phase tiếp
**Scope**: Chia 1590 dòng thành:
- `src/views/budget-plan/BudgetPlan.tsx` (orchestration, ~200 dòng)
- `src/views/budget-plan/JarPlanner.tsx`
- `src/views/budget-plan/EditablePercent.tsx` (`l.259-316`, đã standalone về logic)
- `src/views/budget-plan/JarDrillDown.tsx` (`l.320-360`)
- `src/views/budget-plan/PlannedExpenseForm.tsx` (`l.377+`)
- `src/views/budget-plan/StatusBadge.tsx` — RENAME để tránh xung đột với `Goals.tsx:42` (P4)
**Tại sao**: P4 fix. Cùng pattern áp dụng cho `Goals.tsx` (898 dòng) và `Jars.tsx` (573 dòng) ở phase sau.

### S4. **Adopt Tailwind v4 design tokens đúng cách** — replace dark-override hack
**Scope**:
- Mở rộng `@theme` block trong `index.css:6` để khai báo `--color-primary`, `--color-success`, `--color-danger`, `--color-warning`, `--color-surface`, v.v. — generate ra Tailwind classes như `bg-surface`, `text-success`
- Xóa hết `.dark .bg-slate-50 { ... }` overrides ở `index.css:69-309`
- Mọi component dùng `bg-surface`, `text-primary` thay vì `bg-white dark:bg-[#1a2433]` + class wall
- Hex literals `bg-[#1a2433]` (77 chỗ) → token consume
**Tại sao**: P1, P10 fix. Đổi brand color = sửa 1 dòng.

### S5. **Toast/notification system thay alert/confirm** — UX must-have
**Scope**:
- Thêm `<Toaster>` provider ở `main.tsx` (sonner hoặc react-hot-toast — cả hai đều ~3KB gzip)
- `<ConfirmDialog>` component dùng `<Modal>` từ S1
- Migrate 4 chỗ: `Goals.tsx:446` (alert), `BudgetPlan.tsx:704` (confirm), `BudgetPlan.tsx:1109` (alert), `Debts.tsx:439` (confirm)
**Tại sao**: P8 fix. Brand UX nâng cấp tức thì.

### S6. **A11y baseline pass** — không cần redesign, làm song song
**Scope**:
- Buttons icon-only thêm `aria-label` (`TopBar.tsx:84,93`, `TransactionDetails.tsx:39`)
- Modal: `role="dialog"`, `aria-modal="true"`, focus management qua S1's `<Modal>`
- Charts: thêm `<title>` và `<desc>` qua recharts `accessibilityLayer` prop (recharts ≥ 2.10 hỗ trợ)
- Status: thêm icon/text bên cạnh color (`Transactions.tsx:264-268`)
- Test với `eslint-plugin-jsx-a11y` (chưa có trong devDeps) + manual screen reader pass
**Tại sao**: P9 fix. Phù hợp với app tài chính (audience cần a11y).

---

## Appendix: Quick metric snapshot

```
Frontend LOC (tsx + ts in src/):
  src/App.tsx                              50
  src/main.tsx                             29
  src/lib/api.ts                          472
  src/lib/hooks.ts                        768
  src/lib/types.ts                        647
  src/lib/utils.ts                         56
  src/components/Header.tsx                70  ← DEAD
  src/components/Sidebar.tsx               62  ← DEAD
  src/components/TopBar.tsx               174
  src/components/TransactionDetails.tsx   179
  src/components/IncomeExpenseChart.tsx   313
  src/components/ExpenseStructureChart.tsx 137
  src/views/Overview.tsx                  275
  src/views/Transactions.tsx              368
  src/views/JarStats.tsx                  121
  src/views/Jars.tsx                      573  ← split candidate
  src/views/Goals.tsx                     898  ← split candidate
  src/views/Debts.tsx                     451
  src/views/BudgetPlan.tsx               1590  ← critical split
                                       -----
                                  ~7,233 LOC

Anti-pattern hit counts:
  Hardcoded `bg-[#hex]`/`text-[#hex]`            77 in 12 files
  `rounded-lg border border-slate-300` (input)   33 in 3 files
  `bg-blue-600 hover:bg-blue-700` (primary btn)   9 in 3 files
  `fixed inset-0 bg-slate-900/30 backdrop-blur`   6 in 4 files
  `alert()`/`confirm()`                            4 in 3 files
  a11y attributes (aria-/role=/alt=/onKeyDown)    7 in 1 file (rest = 0)
  Dead components                                  2 (Header, Sidebar)
```
