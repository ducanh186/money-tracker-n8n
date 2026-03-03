#!/bin/bash
# Deploy script for Money Tracker on EC2
# Run this script on EC2 after cloning the repo

set -e

echo "🚀 Starting Money Tracker deployment..."

# Variables
DEPLOY_DIR="/opt/almoney"
REPO_DIR="$DEPLOY_DIR/money-tracker"

# 1. Create directory structure
echo "📁 Creating directory structure..."
sudo mkdir -p $DEPLOY_DIR/{secrets,logs}
sudo chown -R $USER:$USER $DEPLOY_DIR

# 2. Check if repo exists, clone or pull
if [ -d "$REPO_DIR" ]; then
    echo "📥 Updating existing repo..."
    cd $REPO_DIR
    git pull origin main
else
    echo "📦 Cloning repository..."
    cd $DEPLOY_DIR
    git clone https://github.com/YOUR_USERNAME/money-tracker-n8n.git money-tracker
fi

cd $REPO_DIR

# 3. Check for required secrets
echo "🔐 Checking secrets..."
if [ ! -f "$DEPLOY_DIR/secrets/google-service-account.json" ]; then
    echo "❌ Missing: $DEPLOY_DIR/secrets/google-service-account.json"
    echo "   Please upload your Google Service Account JSON file"
    exit 1
fi

if [ ! -f "$REPO_DIR/deploy/.env" ]; then
    echo "❌ Missing: $REPO_DIR/deploy/.env"
    echo "   Copying from .env.example..."
    cp $REPO_DIR/deploy/.env.example $REPO_DIR/deploy/.env
    echo "   Please edit $REPO_DIR/deploy/.env with your actual values"
    exit 1
fi

# 4. Check Laravel .env
if [ ! -f "$REPO_DIR/api/.env" ]; then
    echo "📝 Creating Laravel .env from example..."
    cp $REPO_DIR/api/.env.example $REPO_DIR/api/.env
    echo "   Please edit $REPO_DIR/api/.env and set:"
    echo "   - APP_KEY (run: docker compose run --rm api php artisan key:generate)"
    echo "   - GOOGLE_SHEETS_SPREADSHEET_ID"
    echo "   - GOOGLE_SHEETS_CREDENTIALS_JSON=/run/secrets/gsheets.json"
fi

# 5. Build frontend
echo "🏗️ Building frontend..."
if command -v node &> /dev/null; then
    npm ci --prefix $REPO_DIR
    npm run build --prefix $REPO_DIR
else
    echo "⚠️ Node.js not installed. Installing via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 20
    npm ci --prefix $REPO_DIR
    npm run build --prefix $REPO_DIR
fi

# 6. Copy frontend build to Docker volume
echo "📦 Copying frontend to Docker volume..."
docker volume create almoney_web_static || true
docker run --rm \
    -v almoney_web_static:/out \
    -v $REPO_DIR/dist:/in:ro \
    alpine sh -c "rm -rf /out/* && cp -r /in/* /out/"

# 7. Ensure n8n local-files dir exists (mounted volume)
mkdir -p $REPO_DIR/n8n/local-files

# 8. Stop old containers if running
echo "🛑 Stopping old containers..."
cd $REPO_DIR/deploy
docker compose down --remove-orphans 2>/dev/null || true

# Also stop old n8n-only stack if exists
cd /opt/n8n 2>/dev/null && docker compose down --remove-orphans 2>/dev/null || true

# 9. Start new stack
echo "🚀 Starting services..."
cd $REPO_DIR/deploy
docker compose --env-file .env up -d --build

# 10. Health check
echo "⏳ Waiting for services to start..."
sleep 10

echo "🔍 Checking service status..."
docker compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure Cloudflare Tunnel to route:"
echo "   - almoneytracker.live → http://localhost:8080"
echo "   - n8n.almoneytracker.live → http://localhost:8080"
echo ""
echo "2. Test endpoints:"
echo "   curl http://localhost:8080"
echo "   curl http://localhost:8080/api/health"
echo ""
echo "3. View logs:"
echo "   docker compose logs -f"
