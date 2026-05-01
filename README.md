# Money Tracker n8n

Full-stack personal finance app with a React web client, Laravel API, n8n automation, and a Flutter Android app.

## Stack

- Web desktop: React 19 + TypeScript + Vite in `src/`
- API: Laravel in `api/`
- Mobile: Flutter Android app in `mobile_app/`
- Automation: n8n in `n8n/`
- Production runtime: Docker Compose in `deploy/`

## Current Product Shape

- Web uses `/api` and reads from the Laravel backend.
- Backend combines Google Sheets as the read model with Eloquent tables for planning data.
- Mobile app now uses the production API by default and includes working tabs for overview, transactions, jars, and quick actions.
- Production hosts the web and API behind nginx and Cloudflare Tunnel.

## Repository Layout

```text
.
|- src/                React web app
|- api/                Laravel API
|- mobile_app/         Flutter Android app
|- deploy/             Production Docker Compose + nginx
|- n8n/                Local n8n stack
`- public/             Static public assets
```

## Local Development

### Web

```powershell
npm install
npm run dev
```

Useful commands:

```powershell
npm run build
npm run lint
npm run clean
```

### API

```powershell
Set-Location .\api
composer install
php artisan migrate
php artisan serve
```

Useful commands:

```powershell
php artisan test
php artisan route:list
```

### Mobile Android

```powershell
Set-Location .\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1
```

Build against a custom API:

```powershell
Set-Location .\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -ApiBaseUrl https://your-host.example/api
```

Build and install to an attached device:

```powershell
Set-Location .\mobile_app
powershell -ExecutionPolicy Bypass -File .\build-debug-apk.ps1 -Install -DeviceId <adb-device-id>
```

For cloning the mobile shell into another product, start with `mobile_app/CLONE_BLUEPRINT.md`.

## Key API Endpoints

- `/api/health`
- `/api/health/deep`
- `/api/dashboard/summary?month=May-2026`
- `/api/budget-status?month=May-2026`
- `/api/transactions`

## Production Stack

Production source of truth is `deploy/docker-compose.yml`.

Services:

- `almoney_nginx`
- `almoney_api`
- `almoney_n8n`
- `almoney_cloudflared`

## Notes

- Root `README.md` is now the primary quick-start doc.
- `mobile_app/README.md` contains mobile-specific commands.
- Use `AGENTS.md` as the repo operating guide for implementation details.
