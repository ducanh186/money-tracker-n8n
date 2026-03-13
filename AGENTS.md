# Money Tracker n8n - Agent Guide

## Purpose
This file is the onboarding guide for future coding agents working in this repo.

Use this guide to understand how the app is actually built today, not how older docs describe it.

## Source of truth
Trust sources in this order:

1. Code under `src/`, `api/`, `deploy/`, and `database/migrations/`
2. This `AGENTS.md`
3. `deploy/README.md` for ops context only
4. `README.md` and `api/README.md` last

Known stale docs:

- `README.md` is still an old AI Studio scaffold and does not describe the current app.
- `api/README.md` still describes a read-only Google Sheets API and is no longer accurate.
- `deploy/README.md` has useful context, but `deploy/docker-compose.yml` is the real production source of truth.

## Project snapshot
- Frontend: React 19, TypeScript, Vite 6, TanStack Query 5
- Backend: Laravel 12 on PHP 8.2+
- Automation: n8n
- API base path: `/api`
- Production stack: `deploy/docker-compose.yml`
- Production DB: SQLite file mounted at `/data/app.sqlite` inside the API container
- Data model: hybrid
  - Google Sheets is the source of truth for transaction reads and actual month income/expense
  - Laravel Eloquent tables are the source of truth for budgeting, goals, debts, funds, transfers, and scenarios

## Security guardrails
1. Production access: use AWS SSM only (`aws ssm start-session` / `aws ssm send-command`). Do not use direct SSH via CLI by default.
2. SSH exception rule: only use SSH if the user explicitly requests it for a one-off emergency and confirms the risk.
3. Secrets visibility: never print or expose secret values from `.env`, `*.csv` access keys, OAuth JSON, service-account JSON, tunnel tokens, or private keys.
4. Secrets in git: never add, commit, push, or stage sensitive files such as `.env*`, `*.pem`, `*accessKeys*.csv`, `*credentials*.csv`, `client_secret_*.json`, `almoneytracker-*.json`, tunnel token files, or any file containing keys, tokens, or passwords.
5. Pre-commit and pre-push gate: before any commit or push, inspect staged files and diffs for secret-like content. If in doubt, stop and ask the user.
6. Runtime secret handling: use environment variables or mounted secret files outside the repo where possible, for example `/opt/almoney/secrets/...` on EC2.
7. Logs and screenshots: redact credentials, tokens, cookies, Authorization headers, and private identifiers.
8. Principle of least privilege: use the minimum AWS permission scope needed and avoid creating or storing long-lived credentials in the repo.
9. Incident response: if a credential leak is suspected, stop deploy and push flows, notify the user, and prioritize rotation or revocation.
10. Safety-first workflow: security constraints override convenience and speed.
11. This workspace contains local gitignored secret artifacts at the repo root. Do not open, print, or stage them unless the user explicitly requests a safe, narrow action.

## Repo map
```text
money-tracker-n8n/
|- src/                         Frontend SPA
|  |- App.tsx                   App shell, month state, no router
|  |- components/TopBar.tsx     Navigation + budget status strip
|  |- views/                    Screens: Overview, Transactions, Jars, BudgetPlan, Goals, Debts
|  |- lib/api.ts                All frontend HTTP calls + month helpers + ETag fetcher
|  |- lib/hooks.ts              React Query hooks + invalidation rules
|  `- lib/types.ts              API contract types
|- api/                         Laravel backend
|  |- routes/api.php            Main API surface
|  |- app/Http/Controllers/Api/ Business endpoints
|  |- app/Models/               Eloquent domain models
|  |- app/Services/             Budgeting logic + Google Sheets repository
|  `- database/migrations/      Schema source of truth
|- deploy/                      Production Docker, nginx, EC2 scheduler
|- n8n/                         Standalone/local n8n compose
`- dist/                        Built frontend output
```

## Frontend mental model

### App shell
- There is no React Router.
- `src/App.tsx` switches views with local `currentView` state.
- The view ids are: `overview`, `transactions`, `jars`, `budget`, `goals`, `debts`.
- `selectedMonth` is shared app state and must stay in `MMM-YYYY` format such as `Mar-2026`.
- Dark mode is local state persisted to `localStorage`.

### Navigation
- Navigation lives in `src/components/TopBar.tsx`.
- If you add or rename a screen, update both `src/App.tsx` and `src/components/TopBar.tsx`.
- `TopBar` also reads global budget status via `useBudgetStatus(selectedMonth)`.

### API access pattern
- All frontend requests should go through `src/lib/api.ts`.
- The current frontend client uses a relative base path: `const BASE = '/api'`.
- Do not assume `VITE_API_URL` is active. The current app does not use it in `src/lib/api.ts`.
- Read requests use `smartFetch()` with ETag support and an in-memory ETag cache.
- Write requests use `apiWrite()`.

### Query pattern
- React Query wrappers live in `src/lib/hooks.ts`.
- `useDashboardSummary`, `useSyncStatus`, and `useBudgetStatus` poll every 60 seconds.
- Most write hooks invalidate affected query families after mutations.
- If you change an API response shape, update:
  - `src/lib/types.ts`
  - `src/lib/api.ts`
  - `src/lib/hooks.ts`
  - the consuming view or component

### Current screens
- `Overview.tsx`: dashboard summary, sync status, budget status, investment summary card, charts, recent transactions
- `Transactions.tsx`: paginated transactions + filters + detail drawer
- `Jars.tsx`: jar-focused summary, transactions, funds, fund creation
- `BudgetPlan.tsx`: plan vs actual, budget periods, jar overrides, bonus allocation, close month, budget settings
- `Goals.tsx`: CRUD goals + contributions
- `Debts.tsx`: CRUD debts + debt payments

## Backend mental model

### API surface
- Main routes live in `api/routes/api.php`.
- Actual API prefix is `/api`, not `/api/v1`.
- Health endpoints:
  - `/api/health`
  - `/api/health/deep`
- Read endpoints are grouped under `etag` middleware where possible.
- Write endpoints are grouped under `throttle:write`.
- Sync trigger is `POST /api/sync` with `throttle:sync`.

### Core controllers
- `TransactionsController`
  - Reads month transactions from Google Sheets
  - Filters, sorts, and paginates in memory
  - Looks up details by `idempotency_key`
- `DashboardController`
  - `summary()` returns lightweight dashboard aggregates
  - `syncStatus()` returns cache and sync metadata
  - `budgetStatus()` merges sheet actuals with DB planning data
  - `triggerSync()` runs the Sheets sync command
- `BudgetPlanController`
  - Returns planned vs actual jar comparison
  - `base_income` resolution order is:
    1. query param
    2. `budget_settings.base_income_override`
    3. month income from Sheets
    4. config fallback
- `BudgetPeriodController`
  - Creates and manages a monthly budgeting workspace
  - Supports allocation, bonus allocation, per-jar overrides, and close flow
- `BudgetLineController`
  - CRUD for planned items inside a jar allocation
- `GoalController`
  - CRUD + contribution flow
- `DebtController`
  - CRUD + payment flow
- `FundController`
  - CRUD + reserve/spend flow
  - Also exposes investment summary
- `RecurringBillController`, `TransferController`, `ScenarioController`, `JarController`, `AccountController`, `BudgetSettingController`

### Google Sheets read model
- `api/app/Services/GoogleSheetsTransactionsRepository.php` is the read-model gateway.
- It reads Google Sheets credentials from config and supports file-based credentials.
- It caches:
  - all rows under `sheets_all_rows`
  - month-specific subsets
- When changing anything that affects actual income, expense, transaction filtering, or dashboard actuals, inspect:
  - `GoogleSheetsTransactionsRepository`
  - `TransactionsController`
  - `DashboardController`
  - `BudgetPlanController`

### Eloquent write model
Important models:

- `Jar`
- `BudgetPeriod`
- `JarAllocation`
- `BudgetLine`
- `Goal`
- `GoalContribution`
- `Debt`
- `DebtPayment`
- `RecurringBill`
- `Fund`
- `Transfer`
- `Account`
- `Scenario`
- `BudgetSetting`

Important relationships:

- `BudgetPeriod` owns `jarAllocations`, `budgetLines`, `goalContributions`, `debtPayments`, `transfers`, and `scenarios`
- `JarAllocation` belongs to a `Jar` and a `BudgetPeriod`
- `BudgetLine` can point to a goal, debt, recurring bill, or fund
- `Jar` owns goals, funds, recurring bills, transfers, and allocations

## Domain model

### Six jars
The app uses a fixed six-jar budgeting system:

- `NEC`
- `EDU`
- `LTSS`
- `PLAY`
- `FFA`
- `GIVE`

Agents should treat these jar keys as stable unless the user explicitly wants a domain change.

### Budgeting concepts
- A `BudgetPeriod` is the month-level budget workspace.
- A `JarAllocation` is the amount assigned to one jar for that period.
- A `BudgetLine` is a planned commitment within a jar allocation.
- A `Goal` tracks a savings target.
- A `Debt` tracks payoff progress and payments.
- A `Fund` tracks either `sinking_fund` or `investment`.
- A `RecurringBill` is a repeating obligation.
- A `Transfer` records movement between accounts or budgeted destinations.
- A `Scenario` stores what-if planning results.

### Month handling
- The month format across frontend and backend is `MMM-YYYY`.
- Helpers live in `src/lib/api.ts`:
  - `getCurrentMonth()`
  - `getRecentMonths()`
  - `formatMonthLabel()`
- Do not silently switch month handling to ISO dates unless you update the whole stack.

## Important hotspots
1. `README.md` is stale. Ignore it for architecture decisions.
2. `api/README.md` is stale. It does not describe the current CRUD budgeting backend.
3. Production uses SQLite volume storage, not MySQL.
4. The frontend does not use a router. View changes belong in `App.tsx` and `TopBar.tsx`.
5. The frontend API base is `/api`, not `/api/v1`.
6. `deploy/docker-compose.yml` is the source of truth for production mounts and env overrides.
7. `deploy/README.md` still contains an older Google Sheets secret path example (`/run/secrets/gsheets.json`), while the production compose mounts `../secrets/google-service-account.json` to `/var/www/storage/app/gsheets.json`.
8. The investment summary contract is currently a likely mismatch:
   - frontend `src/views/Overview.tsx` expects fields like `planned_allocation`, `total_funded`, and `allocations`
   - backend `FundController::investmentSummary()` returns `funds`, `total_monthly_planned`, `total_monthly_actual`, `total_variance`, and `total_cumulative_contributed`
   - verify the contract before editing investment UI or types

## Change playbooks

### If you change an API response
Update all of the following:

1. Laravel controller or request validation
2. Any model accessors or service logic behind it
3. `src/lib/types.ts`
4. `src/lib/api.ts`
5. `src/lib/hooks.ts`
6. The consuming view or component

### If you change transaction or actual-spend logic
Inspect all affected read-model paths:

1. `api/app/Services/GoogleSheetsTransactionsRepository.php`
2. `api/app/Http/Controllers/Api/TransactionsController.php`
3. `api/app/Http/Controllers/Api/DashboardController.php`
4. `api/app/Http/Controllers/Api/BudgetPlanController.php`
5. `src/views/Overview.tsx`
6. `src/views/Transactions.tsx`
7. `src/views/BudgetPlan.tsx`

### If you add a new screen
Update:

1. `src/App.tsx`
2. `src/components/TopBar.tsx`
3. Any new hooks or API functions
4. Shared month handling if the screen is month-scoped

### If you add a new planning entity
Usually touch:

1. migration
2. model
3. controller
4. route
5. frontend types
6. frontend API client
7. React Query hooks
8. consuming UI

## Useful commands

### Frontend
```bash
npm install
npm run dev
npm run lint
npm run build
```

### Backend
```bash
cd api
composer install
php artisan migrate
php artisan route:list
php artisan test
```

### Production stack
```bash
cd deploy
docker compose up -d
docker compose logs -f
docker compose down
```

## Verification checklist
Run the smallest relevant verification for the files you changed.

Common checks:

1. `npm run lint`
2. `npm run build`
3. `cd api && php artisan test`
4. `cd api && php artisan route:list`

For production-facing fixes, if the user asks for deploy validation, confirm:

1. `/api/health`
2. The affected endpoint
3. `docker compose ps` on EC2 via SSM

## Environment and secrets
- Frontend client currently uses relative `/api`; do not assume a `VITE_API_URL` flow exists.
- Backend env lives in `api/.env`.
- Production API container mounts:
  - `../api/.env` to `/var/www/.env`
  - `../secrets/google-service-account.json` to `/var/www/storage/app/gsheets.json`
- Never commit `.env`, JSON credentials, CSV access keys, PEM files, or tunnel tokens.

## Production access

### Instance info
| Key | Value |
|---|---|
| Instance ID | `i-08f95fa4a3f710ef1` |
| Region | `us-east-1` |
| Type | `t3.small` |
| Name | `n8n-prod` |
| OS | Ubuntu 24.04 |
| Repo path | `/opt/almoney/money-tracker/` |

### Access method: SSM only
```powershell
# Set AWS credentials from the local CSV without printing values
$csv = Import-Csv "al-admin_accessKeys.csv"
$env:AWS_ACCESS_KEY_ID = $csv.'Access key ID'
$env:AWS_SECRET_ACCESS_KEY = $csv.'Secret access key'
$env:AWS_DEFAULT_REGION = "us-east-1"

# Interactive shell
aws ssm start-session --target i-08f95fa4a3f710ef1 --region us-east-1

# Run one command
aws ssm send-command --region us-east-1 --instance-ids i-08f95fa4a3f710ef1 `
  --document-name "AWS-RunShellScript" `
  --parameters 'commands=["docker ps"]' `
  --query "Command.CommandId" --output text
```

### Production containers
| Container | Purpose | Port |
|---|---|---|
| `almoney_api` | Laravel PHP-FPM | `9000` |
| `almoney_nginx` | Reverse proxy + static frontend | `127.0.0.1:8080` |
| `almoney_n8n` | n8n | `127.0.0.1:5678` |
| `almoney_cloudflared` | Cloudflare Tunnel | host network |

### Useful SSM commands
```bash
# Logs
docker compose -f /opt/almoney/money-tracker/deploy/docker-compose.yml logs -f

# Health
curl -H 'Host: almoneytracker.live' http://localhost:8080/api/health

# Example budget endpoint
curl -H 'Host: almoneytracker.live' 'http://localhost:8080/api/budget-plan?month=Mar-2026'
```

### Deploy flow via SSM
```powershell
$INSTANCE_ID = "i-08f95fa4a3f710ef1"
$commands = @(
  "export HOME=/root && git config --global --add safe.directory /opt/almoney/money-tracker",
  "cd /opt/almoney/money-tracker && git fetch --all --prune && git checkout main && git pull --ff-only",
  "export NVM_DIR=/home/ubuntu/.nvm && . /home/ubuntu/.nvm/nvm.sh && cd /opt/almoney/money-tracker && npm ci && npm run build",
  "docker volume create almoney_web_static 2>/dev/null; docker run --rm -v almoney_web_static:/out -v /opt/almoney/money-tracker/dist:/in:ro alpine sh -c 'rm -rf /out/* && cp -r /in/* /out/'",
  "cd /opt/almoney/money-tracker/deploy && docker compose up -d --build",
  "sleep 5 && curl -sf -H 'Host: almoneytracker.live' http://localhost:8080/api/health && echo OK || echo FAIL",
  "cd /opt/almoney/money-tracker/deploy && docker compose ps"
)
$jsonCommands = $commands | ConvertTo-Json -Compress
$cmdId = aws ssm send-command --region us-east-1 --instance-ids $INSTANCE_ID `
  --document-name "AWS-RunShellScript" `
  --parameters "{`"commands`":$jsonCommands}" `
  --timeout-seconds 300 --query "Command.CommandId" --output text

for ($i = 1; $i -le 60; $i++) {
  $status = (aws ssm get-command-invocation --region us-east-1 `
    --command-id $cmdId --instance-id $INSTANCE_ID `
    --query "Status" --output text 2>$null).Trim()
  Write-Host "[$i] $status"
  if ($status -in @("Success","Failed","TimedOut","Cancelled")) { break }
  Start-Sleep 5
}
```

## URLs
- App: `https://almoneytracker.live`
- n8n: `https://n8n.almoneytracker.live`
- API health: `https://almoneytracker.live/api/health`

## Final reminders for agents
- Prefer code over docs.
- Preserve the `MMM-YYYY` month convention.
- Treat Google Sheets as the read model and Eloquent as the planning write model.
- Update frontend types, client code, hooks, and views together when contracts change.
- Use SSM for production operations.
- Do not expose secrets.
