# Deployment Guide - Money Tracker

## Prerequisites

- EC2 instance with Docker installed
- Cloudflare account with Zero Trust enabled
- Google Service Account JSON for Sheets API
- Domain `almoneytracker.live` pointed to Cloudflare

## Quick Deploy

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# 2. Clone repo
sudo mkdir -p /opt/almoney && sudo chown $USER:$USER /opt/almoney
cd /opt/almoney
git clone https://github.com/YOUR_USERNAME/money-tracker-n8n.git money-tracker
cd money-tracker

# 3. Setup secrets
mkdir -p /opt/almoney/secrets
# Upload your google-service-account.json to /opt/almoney/secrets/

# 4. Configure environment
cp deploy/.env.example deploy/.env
nano deploy/.env  # Add your CF_TUNNEL_TOKEN and N8N_ENCRYPTION_KEY

cp api/.env.example api/.env
nano api/.env     # Configure Laravel settings

# 5. Run deploy script
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

## Architecture

```
Internet
    │
    ↓
Cloudflare (DNS + TLS)
    │
    ↓
Cloudflare Tunnel (cloudflared container)
    │
    ↓
Nginx (port 8080) ─── Routes by hostname ───┐
    │                                        │
    ├── almoneytracker.live                  │
    │   ├── / → React SPA (static)           │
    │   └── /api → Laravel (PHP-FPM)         │
    │                                        │
    └── n8n.almoneytracker.live              │
        └── / → n8n (port 5678)              │
```

## Cloudflare Tunnel Configuration

In Cloudflare Zero Trust dashboard, add these public hostnames:

| Hostname | Service |
|----------|---------|
| `almoneytracker.live` | `http://localhost:8080` |
| `www.almoneytracker.live` | `http://localhost:8080` |
| `n8n.almoneytracker.live` | `http://localhost:8080` |

> Note: All traffic goes to nginx which routes internally by Host header.

## Migrating from Existing n8n Setup

If you already have n8n running at `/opt/n8n`:

```bash
# 1. Copy existing secrets
cp /opt/n8n/.env deploy/.env

# 2. The n8n_data volume will be preserved (renamed to almoney_n8n_data)
# If you want to keep the same volume:
docker volume create almoney_n8n_data
docker run --rm -v n8n_data:/from -v almoney_n8n_data:/to alpine sh -c "cp -a /from/. /to/"

# 3. Stop old stack
cd /opt/n8n && docker compose down

# 4. Start new combined stack
cd /opt/almoney/money-tracker/deploy && docker compose up -d
```

## Environment Variables

### deploy/.env
```env
CF_TUNNEL_TOKEN=xxx     # From Cloudflare Zero Trust
N8N_ENCRYPTION_KEY=xxx  # openssl rand -hex 32
GENERIC_TIMEZONE=Asia/Bangkok
```

### api/.env
```env
APP_KEY=base64:xxx      # php artisan key:generate
APP_URL=https://almoneytracker.live
GOOGLE_SHEETS_CREDENTIALS_JSON=/run/secrets/gsheets.json
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
```

## Useful Commands

```bash
# View all logs
docker compose logs -f

# View specific service
docker compose logs -f api

# Rebuild after code changes
docker compose up -d --build api

# Rebuild frontend
npm run build
docker run --rm -v almoney_web_static:/out -v ./dist:/in:ro alpine sh -c "rm -rf /out/* && cp -r /in/* /out/"
docker compose restart nginx

# Enter container shell
docker compose exec api sh
docker compose exec n8n sh

# Generate Laravel key
docker compose run --rm api php artisan key:generate
```

## Troubleshooting

### 502 Bad Gateway
- Check if api container is running: `docker compose ps`
- Check api logs: `docker compose logs api`

### n8n not accessible
- Verify nginx config has correct proxy_pass
- Check n8n container: `docker compose logs n8n`

### API returns 500
- Check Laravel logs: `docker compose exec api cat storage/logs/laravel.log`
- Verify .env is correct
- Check Google credentials path
