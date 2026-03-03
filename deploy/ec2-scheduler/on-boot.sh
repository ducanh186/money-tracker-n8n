#!/bin/bash
# ============================================================
# Boot script cho EC2 sau stop/start
# Chạy bởi systemd: almoney-boot.service
# Idempotent + retry-safe
# ============================================================
set -euo pipefail

LOG_DIR="/opt/almoney/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/boot-$(date +%Y%m%d-%H%M%S).log"
DEPLOY_DIR="/opt/almoney/money-tracker/deploy"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }

log "========== EC2 boot script started =========="

# --- 1. Wait for Docker daemon ---
log "Waiting for Docker daemon..."
TRIES=0
while ! docker info &>/dev/null; do
    TRIES=$((TRIES + 1))
    if [ "$TRIES" -ge 60 ]; then
        log "FATAL: Docker daemon not ready after 60s"
        exit 1
    fi
    sleep 1
done
log "Docker daemon ready (${TRIES}s)"

# --- 2. Ensure compose stack is up (idempotent) ---
cd "$DEPLOY_DIR"
log "Running docker compose up -d..."
docker compose --env-file .env up -d 2>&1 | tee -a "$LOG_FILE"

# --- 3. Wait for containers to be healthy/running ---
log "Waiting for containers to be healthy..."
EXPECTED_SERVICES=("almoney_api" "almoney_n8n" "almoney_nginx" "almoney_cloudflared")
MAX_WAIT=120
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
fi

# --- 4. Final HTTP health check ---
log "Running HTTP health check..."
TRIES=0
MAX_TRIES=12
HTTP_OK=false
while [ "$TRIES" -lt "$MAX_TRIES" ]; do
    HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: almoneytracker.live' http://localhost:8080/api/health 2>/dev/null || echo "000")
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
    log "WARNING: API health check failed after ${MAX_TRIES} attempts (non-fatal)"
fi

# --- 5. Summary ---
log "Container status:"
docker compose ps 2>&1 | tee -a "$LOG_FILE"
log "========== Boot script completed =========="
