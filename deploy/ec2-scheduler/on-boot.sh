#!/bin/bash
# ============================================================
# Boot script cho EC2 sau stop/start
# Chạy bởi systemd: almoney-boot.service
# Idempotent + retry-safe + log rotation
# ============================================================
set -euo pipefail

LOG_DIR="/opt/almoney/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/boot-$(date +%Y%m%d-%H%M%S).log"
DEPLOY_DIR="/opt/almoney/money-tracker/deploy"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "========== EC2 boot script started =========="

# --- 0. Log rotation (keep last 10 boot logs) ---
log "Cleaning old boot logs..."
ls -t "$LOG_DIR"/boot-*.log 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

# --- 1. Wait for Docker daemon ---
log "Waiting for Docker daemon..."
TRIES=0
while ! docker info &>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge 90 ]; then
        log "FATAL: Docker daemon not ready after 90s"
        exit 1
    fi
    sleep 1
done
log "Docker daemon ready (${TRIES}s)"

# --- 2. Wait for network connectivity (DNS resolution) ---
log "Checking network connectivity..."
TRIES=0
while ! getent hosts registry-1.docker.io &>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge 30 ]; then
        log "WARNING: DNS not resolving after 30s (continuing anyway)"
        break
    fi
    sleep 1
done
log "Network ready (${TRIES}s)"

# --- 3. Verify .env and bring stack up ---
cd "$DEPLOY_DIR"

if [ ! -f ".env" ]; then
    log "FATAL: $DEPLOY_DIR/.env not found"
    exit 1
fi

# Force-recreate API container to trigger entrypoint cache-clear
# This is the KEY fix: ensures Laravel clears stale config on every boot
log "Force-recreating API container (cache warm-up)..."
docker compose --env-file .env up -d --force-recreate --no-deps api 2>&1 | tee -a "$LOG_FILE"

# Bring up remaining services (idempotent)
log "Running docker compose up -d (all services)..."
docker compose --env-file .env up -d 2>&1 | tee -a "$LOG_FILE"

# --- 4. Wait for containers to be healthy/running ---
log "Waiting for containers to be healthy..."
EXPECTED_SERVICES=("almoney_api" "almoney_n8n" "almoney_nginx" "almoney_cloudflared")
MAX_WAIT=180
ELAPSED=0

while [ "$ELAPSED" -lt "$MAX_WAIT" ]; do
    ALL_OK=true
    LAST_SVC=""
    LAST_STATE=""
    LAST_HEALTH=""
    for SVC in "${EXPECTED_SERVICES[@]}"; do
        STATE=$(docker inspect --format='{{.State.Status}}' "$SVC" 2>/dev/null || echo "missing")
        HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$SVC" 2>/dev/null || echo "unknown")

        if [ "$STATE" != "running" ]; then
            ALL_OK=false
            LAST_SVC="$SVC"; LAST_STATE="$STATE"; LAST_HEALTH="$HEALTH"
            break
        fi
        if [ "$HEALTH" != "none" ] && [ "$HEALTH" != "healthy" ]; then
            ALL_OK=false
            LAST_SVC="$SVC"; LAST_STATE="$STATE"; LAST_HEALTH="$HEALTH"
            break
        fi
    done

    if $ALL_OK; then
        log "All ${#EXPECTED_SERVICES[@]} containers running/healthy (${ELAPSED}s)"
        break
    fi

    ELAPSED=$((ELAPSED + 5))
    sleep 5
    log "Waiting... ${ELAPSED}/${MAX_WAIT}s (${LAST_SVC}: state=${LAST_STATE} health=${LAST_HEALTH})"
done

if [ "$ELAPSED" -ge "$MAX_WAIT" ]; then
    log "WARNING: Not all containers healthy after ${MAX_WAIT}s"
    docker compose ps 2>&1 | tee -a "$LOG_FILE"
    # Dump logs of unhealthy containers for debugging
    for SVC in "${EXPECTED_SERVICES[@]}"; do
        HEALTH=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$SVC" 2>/dev/null || echo "unknown")
        if [ "$HEALTH" != "none" ] && [ "$HEALTH" != "healthy" ]; then
            log "--- Logs for ${SVC} (last 30 lines) ---"
            docker logs --tail 30 "$SVC" 2>&1 | tee -a "$LOG_FILE"
        fi
    done
fi

# --- 5. Final HTTP health check (end-to-end through nginx) ---
log "Running HTTP health check..."
TRIES=0
MAX_TRIES=18
HTTP_OK=false
while [ "$TRIES" -lt "$MAX_TRIES" ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
        -H 'Host: almoneytracker.live' \
        http://localhost:8080/api/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        log "API health check PASSED (HTTP $HTTP_CODE)"
        HTTP_OK=true
        break
    fi
    TRIES=$((TRIES + 1))
    log "API check ${TRIES}/${MAX_TRIES} (HTTP $HTTP_CODE)"
    sleep 5
done

if ! $HTTP_OK; then
    log "WARNING: API health check failed after ${MAX_TRIES} attempts"
    log "--- API container logs (last 50 lines) ---"
    docker logs --tail 50 almoney_api 2>&1 | tee -a "$LOG_FILE"
    log "--- Nginx container logs (last 20 lines) ---"
    docker logs --tail 20 almoney_nginx 2>&1 | tee -a "$LOG_FILE"
fi

# --- 6. Docker cleanup (prevent disk full) ---
log "Docker cleanup..."
docker system prune -f --filter "until=168h" 2>&1 | tee -a "$LOG_FILE" || true

# --- 7. Summary ---
log "Container status:"
docker compose ps 2>&1 | tee -a "$LOG_FILE"
log "Disk usage:"
df -h / 2>&1 | tee -a "$LOG_FILE"
log "========== Boot script completed (HTTP: $(if $HTTP_OK; then echo 'OK'; else echo 'FAILED'; fi)) =========="
