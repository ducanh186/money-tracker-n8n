#!/bin/sh
# ============================================================
# Docker entrypoint for Laravel API (PHP-FPM)
# Clears stale cache and warms up before starting PHP-FPM
# Runs on EVERY container start (including after EC2 stop/start)
# ============================================================
set -e

echo "[entrypoint] $(date '+%Y-%m-%d %H:%M:%S') Starting Laravel warm-up..."

# --- 1. Ensure storage directories exist with correct permissions ---
# These might be mounted volumes; ensure structure is intact
for DIR in \
    /var/www/storage/framework/cache/data \
    /var/www/storage/framework/sessions \
    /var/www/storage/framework/views \
    /var/www/storage/logs; do
    mkdir -p "$DIR" 2>/dev/null || true
done
chown -R www-data:www-data /var/www/storage 2>/dev/null || true
chmod -R 775 /var/www/storage 2>/dev/null || true

# --- 1b. Ensure SQLite persistent volume is ready ---
mkdir -p /data 2>/dev/null || true
if [ ! -f /data/app.sqlite ]; then
    echo "[entrypoint] Creating new SQLite database at /data/app.sqlite"
    touch /data/app.sqlite
else
    echo "[entrypoint] Existing SQLite database found at /data/app.sqlite"
fi
chown www-data:www-data /data/app.sqlite 2>/dev/null || true
chmod 664 /data/app.sqlite 2>/dev/null || true
chown www-data:www-data /data 2>/dev/null || true
chmod 775 /data 2>/dev/null || true

# --- 2. Clear ALL stale caches (idempotent) ---
# After EC2 stop/start, cached config may reference stale state
echo "[entrypoint] Clearing stale caches..."
php artisan config:clear  2>/dev/null || true
php artisan route:clear   2>/dev/null || true
php artisan view:clear    2>/dev/null || true
php artisan event:clear   2>/dev/null || true

# --- 3. Run database migrations + seed jars ---
echo "[entrypoint] Running database migrations..."
php artisan migrate --force 2>/dev/null || echo "[entrypoint] WARNING: migrate failed (non-fatal)"
php artisan db:seed --class=Database\\Seeders\\JarSeeder --force 2>/dev/null || echo "[entrypoint] WARNING: JarSeeder failed (non-fatal)"

# --- 4. Rebuild caches for production performance ---
echo "[entrypoint] Rebuilding production caches..."
php artisan config:cache  || echo "[entrypoint] WARNING: config:cache failed (non-fatal)"
php artisan route:cache   || echo "[entrypoint] WARNING: route:cache failed (non-fatal)"

# --- 5. Verify Laravel can bootstrap ---
echo "[entrypoint] Verifying Laravel bootstrap..."
if php artisan --version > /dev/null 2>&1; then
    echo "[entrypoint] Laravel OK: $(php artisan --version 2>/dev/null)"
else
    echo "[entrypoint] ERROR: Laravel bootstrap failed!"
    # Don't exit — still start PHP-FPM so we can debug via docker logs
fi

echo "[entrypoint] Warm-up complete. Starting scheduler + PHP-FPM..."

# --- 6. Start Laravel scheduler in background ---
# schedule:work runs every minute, checks for due commands (e.g. sheets:sync)
echo "[entrypoint] Starting Laravel scheduler (background)..."
php artisan schedule:work >> /var/www/storage/logs/scheduler.log 2>&1 &
echo "[entrypoint] Scheduler PID: $!"

# --- 7. Exec into PHP-FPM (replaces this process as PID 1) ---
exec "$@"
