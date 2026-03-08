# Money Tracker n8n — Project Guide for Codex

## Project Overview
Full-stack money tracking app with:
- **Frontend**: React + TypeScript + Vite (`src/`)
- **Backend**: Laravel 11 PHP API (`api/`)
- **Automation**: n8n workflow (`n8n/`)
- **Deploy**: Docker + AWS EC2 (`deploy/`)
- **Integrations**: Google Sheets, Google OAuth

## Security Guardrails (MANDATORY)
1. **Production access**: Use AWS SSM only (`aws ssm start-session` / `aws ssm send-command`). Do **not** use direct SSH via CLI by default.
2. **SSH exception rule**: Only use SSH if user explicitly requests it for a one-off emergency and confirms risk acceptance.
3. **Secrets visibility**: Never print or expose secret values from `.env`, `*.csv` access keys, OAuth JSON, service-account JSON, tunnel tokens, or private keys.
4. **Secrets in git**: Never add/commit/push sensitive files (`.env*`, `*.pem`, `*accessKeys*.csv`, `*credentials*.csv`, `client_secret_*.json`, `almoneytracker-*.json`, tunnel token files, or any file containing keys/tokens/passwords).
5. **Pre-commit/push gate**: Before any commit/push, verify staged files and diff for secret-like content. If any doubt exists, stop and ask user.
6. **Runtime secret handling**: Use environment variables or mounted secret files outside repo where possible (example: `/opt/almoney/secrets/...` on EC2).
7. **Logs and screenshots**: Redact command outputs that may contain credentials, tokens, cookies, Authorization headers, or private identifiers.
8. **Principle of least privilege**: Use minimum AWS permission scope needed; avoid creating/storing long-lived credentials in repo/workspace.
9. **Incident response**: If a credential leak is suspected, stop deploy/push flow, notify user, and prioritize key rotation/revocation.
10. **Safety-first workflow**: Security constraints override convenience and speed for all deploy/ops actions.

## Architecture

```
money-tracker-n8n/
├── src/                   # React frontend (TypeScript)
│   ├── App.tsx
│   ├── views/             # Page components (BudgetPlan, etc.)
│   ├── components/        # Shared UI (Header, Sidebar, TransactionDetails)
│   └── lib/               # API client, hooks, types, utils
├── api/                   # Laravel backend
│   ├── app/
│   │   ├── Http/          # Controllers, Middleware, Requests
│   │   ├── Models/        # Eloquent models
│   │   ├── Services/      # Business logic
│   │   └── Contracts/     # Interfaces
│   ├── routes/api.php     # API routes
│   ├── config/            # App configs (database, google_sheets, budget_plan)
│   └── database/          # Migrations, seeders, factories
├── n8n/docker-compose.yml # n8n automation
├── deploy/                # Docker Compose, nginx, EC2 scheduler
├── index.html             # Vite entry
├── vite.config.ts
└── package.json
```

## Tech Stack
| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Backend | Laravel 11, PHP 8.x |
| Database | MySQL (via Laravel Eloquent) |
| Auth | Google OAuth 2.0 |
| External | Google Sheets API |
| Deploy | Docker, nginx, AWS EC2 |
| Automation | n8n |

## Key Commands

### Frontend
```bash
npm run dev        # Dev server
npm run build      # Production build → dist/
npm run preview    # Preview build
```

### Backend (from api/)
```bash
php artisan serve           # Dev server
php artisan migrate         # Run migrations
php artisan migrate:fresh   # Reset DB
php artisan route:list      # List API routes
php artisan tinker          # REPL
composer install            # Install PHP deps
```

### Docker (from deploy/)
```bash
docker compose up -d        # Start all services
docker compose logs -f      # Follow logs
docker compose down         # Stop
```

## API Structure
Base URL: `/api/v1/`

Key endpoints (see `api/routes/api.php` for full list):
- Auth: `/auth/google`, `/auth/callback`
- Transactions: `/transactions`
- Budget: `/budget-plan`
- Google Sheets sync

## Frontend API Client
`src/lib/api.ts` — all HTTP calls go through here.
`src/lib/hooks.ts` — React Query hooks.
`src/lib/types.ts` — TypeScript interfaces.

## Environment Variables
- Frontend: `VITE_API_URL` (in `.env`)
- Backend: standard Laravel `.env` (see `api/.env.example`)
- Google: service account JSON + OAuth credentials (gitignored)

## EC2 Production Access

### Instance Info
| Key | Value |
|-----|-------|
| Instance ID | `i-08f95fa4a3f710ef1` |
| Region | `us-east-1` |
| Type | `t3.small` |
| Name | `n8n-prod` |
| OS | Ubuntu 24.04 |
| Repo Path | `/opt/almoney/money-tracker/` |

### Access Method: SSM (Port 22 closed)
```powershell
# Set AWS credentials (hoặc dùng profile)
$env:AWS_ACCESS_KEY_ID="<from al-admin_accessKeys.csv>"
$env:AWS_SECRET_ACCESS_KEY="<from al-admin_accessKeys.csv>"
$env:AWS_DEFAULT_REGION="us-east-1"

# Interactive shell (requires Session Manager Plugin)
aws ssm start-session --target i-08f95fa4a3f710ef1 --region us-east-1

# Run single command
aws ssm send-command --region us-east-1 --instance-ids i-08f95fa4a3f710ef1 `
  --document-name "AWS-RunShellScript" `
  --parameters 'commands=["docker ps"]' `
  --query "Command.CommandId" --output text

# Get command output (replace $cmdId)
aws ssm get-command-invocation --region us-east-1 --command-id $cmdId `
  --instance-id i-08f95fa4a3f710ef1 --query "StandardOutputContent" --output text
```

### Docker Services on EC2
| Container | Purpose | Health |
|-----------|---------|--------|
| `almoney_api` | Laravel PHP-FPM | Port 9000 |
| `almoney_nginx` | Web server | localhost:8080 |
| `almoney_n8n` | Automation | localhost:5678 |
| `almoney_cloudflared` | Cloudflare Tunnel | - |

### Quick Commands (via SSM)
```bash
# View logs
docker compose -f /opt/almoney/money-tracker/deploy/docker-compose.yml logs -f

# Rebuild & deploy
cd /opt/almoney/money-tracker && git pull origin main
npm ci && npm run build
docker volume create almoney_web_static || true
docker run --rm -v almoney_web_static:/out -v ./dist:/in:ro alpine sh -c "rm -rf /out/* && cp -r /in/* /out/"
cd deploy && docker compose up -d --build

# Test API
curl -H 'Host: almoneytracker.live' http://localhost:8080/api/health
curl -H 'Host: almoneytracker.live' http://localhost:8080/api/budget-plan?month=Mar-2026
```

### URLs
- **App**: https://almoneytracker.live
- **n8n**: https://n8n.almoneytracker.live
- **API Health**: https://almoneytracker.live/api/health

## Important Notes
- `api/vendor/` — gitignored, run `composer install` if missing
- `node_modules/` — gitignored, run `npm install` if missing
- Secrets (`*.json` credentials, `.env*`) — all gitignored, never commit
- EC2 scheduler: `deploy/ec2-scheduler/` — scripts for auto start/stop EC2
- AWS credentials: `al-admin_accessKeys.csv` (gitignored)

## Auto-Deploy to EC2 (from local machine)

After committing & pushing to `main`, deploy via SSM Run Command with **polling** (no fixed Sleep):

### Step 1: Set AWS credentials (once per terminal session)

```powershell
$csv = Import-Csv "al-admin_accessKeys.csv"
$env:AWS_ACCESS_KEY_ID = $csv.'Access key ID'
$env:AWS_SECRET_ACCESS_KEY = $csv.'Secret access key'
$env:AWS_DEFAULT_REGION = "us-east-1"
```

### Step 2: Send deploy command

```powershell
$INSTANCE_ID = "i-08f95fa4a3f710ef1"
$commands = @(
  "export HOME=/root && git config --global --add safe.directory /opt/almoney/money-tracker",
  "cd /opt/almoney/money-tracker && git fetch --all --prune && git checkout main && git pull --ff-only",
  "export NVM_DIR=/home/ubuntu/.nvm && . /home/ubuntu/.nvm/nvm.sh && cd /opt/almoney/money-tracker && npm ci && npm run build",
  "docker volume create almoney_web_static 2>/dev/null; docker run --rm -v almoney_web_static:/out -v /opt/almoney/money-tracker/dist:/in:ro alpine sh -c 'rm -rf /out/* && cp -r /in/* /out/'",
  "cd /opt/almoney/money-tracker/deploy && docker compose up -d --build",
  "sleep 5 && curl -sf -H 'Host: almoneytracker.live' http://localhost:8080/api/health && echo ' OK' || echo ' FAIL'",
  "cd /opt/almoney/money-tracker/deploy && docker compose ps"
)
$jsonCommands = $commands | ConvertTo-Json -Compress
$cmdId = aws ssm send-command --region us-east-1 --instance-ids $INSTANCE_ID `
  --document-name "AWS-RunShellScript" `
  --parameters "{`"commands`":$jsonCommands}" `
  --timeout-seconds 300 --query "Command.CommandId" --output text
Write-Host "Command ID: $cmdId"
```

### Step 3: Poll until completion (recommended — no fixed Sleep)

```powershell
for ($i = 1; $i -le 60; $i++) {
  $status = (aws ssm get-command-invocation --region us-east-1 `
    --command-id $cmdId --instance-id $INSTANCE_ID `
    --query "Status" --output text 2>$null).Trim()
  Write-Host "[$i] $status"
  if ($status -in @("Success","Failed","TimedOut","Cancelled")) { break }
  Start-Sleep 5
}
# Show results (use --query on Status+STDERR to avoid Unicode encoding issues from npm output)
$out = aws ssm get-command-invocation --region us-east-1 `
  --command-id $cmdId --instance-id $INSTANCE_ID `
  --query "[Status, StandardErrorContent]" `
  --output json | ConvertFrom-Json
Write-Host "`nStatus: $($out[0])"
if ($out[1]) { Write-Host "`nSTDERR: $($out[1])" }
```

### One-liner (copy-paste full deploy + poll)

```powershell
$I="i-08f95fa4a3f710ef1"; $cmds='["export HOME=/root && git config --global --add safe.directory /opt/almoney/money-tracker","cd /opt/almoney/money-tracker && git fetch --all --prune && git checkout main && git pull --ff-only","export NVM_DIR=/home/ubuntu/.nvm && . /home/ubuntu/.nvm/nvm.sh && cd /opt/almoney/money-tracker && npm ci && npm run build","docker volume create almoney_web_static 2>/dev/null; docker run --rm -v almoney_web_static:/out -v /opt/almoney/money-tracker/dist:/in:ro alpine sh -c ''rm -rf /out/* && cp -r /in/* /out/''","cd /opt/almoney/money-tracker/deploy && docker compose up -d --build","sleep 5 && curl -sf -H ''Host: almoneytracker.live'' http://localhost:8080/api/health && echo OK || echo FAIL","cd /opt/almoney/money-tracker/deploy && docker compose ps"]'; $id=aws ssm send-command --region us-east-1 --instance-ids $I --document-name AWS-RunShellScript --parameters "{`"commands`":$cmds}" --timeout-seconds 300 --query Command.CommandId --output text; Write-Host "Sent: $id"; for($i=1;$i -le 60;$i++){$s=(aws ssm get-command-invocation --region us-east-1 --command-id $id --instance-id $I --query Status --output text 2>$null).Trim(); Write-Host "[$i] $s"; if($s -in @('Success','Failed','TimedOut','Cancelled')){break}; Start-Sleep 5}; aws ssm get-command-invocation --region us-east-1 --command-id $id --instance-id $I --query "[Status,StandardErrorContent]" --output json | ConvertFrom-Json | ForEach-Object { Write-Host "`nStatus: $($_[0])"; if($_[1]){Write-Host "STDERR: $($_[1])"} }
```



