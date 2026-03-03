# EC2 Infrastructure - Permanent Setup Guide

## Tổng quan kiến trúc "vĩnh viễn"

```
┌─────────────────────────────────────────────────────────────┐
│ INTERNET                                                     │
│   ↓                                                          │
│ Cloudflare Tunnel (outbound only - không cần public IP)      │
│   ↓                                                          │
│ EC2 Instance                                                 │
│ ├── systemd: almoney-boot.service (After=docker.service)     │
│ │     └── on-boot.sh (idempotent, retry-safe)                │
│ │           ├── 1. Wait Docker daemon                        │
│ │           ├── 2. Wait network                              │
│ │           ├── 3. Force-recreate API (cache clear)          │
│ │           ├── 4. docker compose up -d                      │
│ │           ├── 5. Wait healthchecks                         │
│ │           ├── 6. HTTP health check (end-to-end)            │
│ │           └── 7. Docker cleanup + summary                  │
│ ├── Docker Compose                                           │
│ │     ├── api (PHP-FPM + entrypoint warm-up + FCGi ping HC)  │
│ │     ├── n8n (wget /healthz HC)                             │
│ │     ├── nginx (depends_on: api+n8n healthy)                │
│ │     └── cloudflared (depends_on: nginx healthy)            │
│ ├── SSM Agent (access via Session Manager, NO port 22)       │
│ └── EventBridge Scheduler (stop 1AM / start 6AM UTC+7)      │
└─────────────────────────────────────────────────────────────┘
```

## 4 tính chất "vĩnh viễn"

| # | Tính chất | Giải pháp |
|---|-----------|-----------|
| 1 | **Access không phụ thuộc IP** | SSM Session Manager (đóng port 22) |
| 2 | **Scheduler ổn định** | EventBridge + SSM Automation |
| 3 | **Boot tự hồi** | systemd + entrypoint warm-up + healthcheck chain |
| 4 | **Không drift** | All config in repo, deploy via SSM |

---

## Cách cài đặt (theo thứ tự)

### Bước 1: SSM Session Manager (P0)

```bash
cd deploy/ec2-scheduler

# Setup SSM + đóng port 22
chmod +x setup-ssm.sh
./setup-ssm.sh <INSTANCE_ID> <REGION>

# Test
aws ssm start-session --target <INSTANCE_ID> --region <REGION>
```

### Bước 2: EventBridge Scheduler

```bash
# Cài scheduler stop/start
chmod +x setup-scheduler.sh
./setup-scheduler.sh <INSTANCE_ID> <REGION>
```

### Bước 3: Deploy boot infrastructure lên EC2

**Cách A: Via SSM (khuyên dùng, không cần SSH)**
```bash
chmod +x deploy-boot.sh
./deploy-boot.sh <INSTANCE_ID> <REGION>
```

**Cách B: Manually (nếu đã SSH vào EC2)**
```bash
cd /opt/almoney/money-tracker
git pull origin main

# Copy boot script
sudo cp deploy/ec2-scheduler/on-boot.sh /opt/almoney/on-boot.sh
sudo chmod +x /opt/almoney/on-boot.sh

# Update systemd service
sudo cp deploy/ec2-scheduler/almoney-boot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable almoney-boot.service

# Rebuild API container (includes new entrypoint)
cd deploy
docker compose --env-file .env build --no-cache api
docker compose --env-file .env up -d --force-recreate api
docker compose --env-file .env up -d

# Test
sudo systemctl start almoney-boot.service
sudo journalctl -u almoney-boot.service -f
```

### Bước 4: Verify

```bash
# Kiểm tra tất cả containers healthy
docker compose ps

# Kiểm tra API (qua nginx)
curl -H 'Host: almoneytracker.live' http://localhost:8080/api/health

# Kiểm tra boot logs
cat /opt/almoney/logs/boot-*.log | tail -30
```

---

## Scheduler

| Hành động | Giờ UTC+7 | Giờ UTC | Cron (UTC) |
|-----------|-----------|---------|------------|
| 🛑 Tắt EC2 | 1:00 AM  | 18:00  | `0 18 * * ? *` |
| 🟢 Bật EC2 | 6:00 AM  | 23:00  | `0 23 * * ? *` |

**Thời gian tắt:** 5 tiếng/ngày.

### Flow khi BẬT lại (sau stop/start):
1. EventBridge trigger `AWS-StartEC2Instance`
2. EC2 boots (~30-60s)
3. Docker daemon starts
4. systemd `almoney-boot.service` chạy `on-boot.sh`
5. Boot script **force-recreate API** → entrypoint clears cache + warms up
6. Docker healthcheck chain: API (FCGi ping) → n8n (wget /healthz) → nginx → cloudflared
7. HTTP end-to-end health check `/api/health`
8. Cloudflare Tunnel reconnects → Website live ✅

**Thời gian warm-up:** ~2-3 phút (tùy instance type)

### Quản lý scheduler

```bash
# Tắt tạm thời
aws events disable-rule --name almoney-ec2-stop-daily --region ap-southeast-1
aws events disable-rule --name almoney-ec2-start-daily --region ap-southeast-1

# Bật lại
aws events enable-rule --name almoney-ec2-stop-daily --region ap-southeast-1
aws events enable-rule --name almoney-ec2-start-daily --region ap-southeast-1

# Đổi giờ (VD: tắt lúc 2AM UTC+7 = 19:00 UTC)
aws events put-rule \
    --name almoney-ec2-stop-daily \
    --schedule-expression "cron(0 19 * * ? *)" \
    --region ap-southeast-1

# Gỡ hoàn toàn
chmod +x remove-scheduler.sh
./remove-scheduler.sh ap-southeast-1
```

---

## Tại sao API bị 500 sau stop/start (và cách fix)

### Nguyên nhân gốc

1. EC2 restart → Docker restart containers (không recreate)
2. PHP-FPM process starts → **old healthcheck** (`pgrep php-fpm`) báo healthy ngay
3. Nhưng Laravel **chưa bootstrap xong** hoặc có **stale cached config**
4. Nginx nhận traffic → forward tới PHP-FPM → Laravel 500

### Fix đã áp dụng (3 lớp bảo vệ)

| Lớp | Thay đổi | File |
|-----|----------|------|
| 1. **Entrypoint warm-up** | Mỗi lần container start: clear cache → rebuild → verify Laravel | `api/docker-entrypoint.sh` |
| 2. **Real healthcheck** | FCGi ping thay vì `pgrep` (verify PHP-FPM responds) | `deploy/docker-compose.yml` |
| 3. **Boot script force-recreate** | API container luôn được recreate khi boot → trigger entrypoint | `deploy/ec2-scheduler/on-boot.sh` |

### Dependency chain (đảm bảo thứ tự đúng)

```
api (healthy: FCGi ping responds) ──┐
                                     ├── nginx (healthy: PID check)── cloudflared
n8n (healthy: wget /healthz)  ──────┘
```

Nginx **CHỈ start** khi cả API và n8n đều healthy.
Cloudflared **CHỈ start** khi nginx healthy.
→ User KHÔNG BAO GIỜ thấy 500 vì nginx chưa up khi API chưa ready.

---

## Troubleshooting

### API 500 (nếu vẫn xảy ra)

```bash
# 1. Xem entrypoint logs
docker logs almoney_api 2>&1 | head -20

# 2. Kiểm tra Laravel bootstrap
docker exec almoney_api php artisan --version

# 3. Clear cache thủ công
docker exec almoney_api php artisan config:clear
docker exec almoney_api php artisan config:cache

# 4. Kiểm tra .env mounted
docker exec almoney_api cat /var/www/.env | head -5

# 5. Force recreate
cd /opt/almoney/money-tracker/deploy
docker compose --env-file .env up -d --force-recreate --build api
```

### Containers không healthy

```bash
# Xem chi tiết health
docker inspect --format='{{json .State.Health}}' almoney_api | python3 -m json.tool

# Xem boot logs
cat /opt/almoney/logs/boot-*.log | tail -50

# Xem systemd logs
sudo journalctl -u almoney-boot.service --no-pager -n 100
```

### SSM không kết nối

```bash
# Kiểm tra SSM Agent
sudo systemctl status snap.amazon-ssm-agent.amazon-ssm-agent  # Ubuntu
sudo systemctl status amazon-ssm-agent  # Amazon Linux

# Kiểm tra IAM role
curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/

# Kiểm tra outbound HTTPS
curl -s https://ssm.ap-southeast-1.amazonaws.com
```

### Cloudflare Tunnel không reconnect

```bash
docker logs almoney_cloudflared --tail 20
docker compose restart cloudflared
```

---

## Files trong thư mục này

| File | Mô tả |
|------|--------|
| `setup-ssm.sh` | **P0** - Setup SSM Session Manager + đóng port 22 |
| `setup-scheduler.sh` | Setup EventBridge stop/start rules |
| `remove-scheduler.sh` | Gỡ bỏ scheduler |
| `deploy-boot.sh` | Deploy boot infra lên EC2 qua SSM |
| `on-boot.sh` | Boot script (chạy bởi systemd) |
| `almoney-boot.service` | systemd unit file |
| `debug-ssm.sh` | Debug SSM registration (chạy trên EC2) |
| `*.json` | IAM policy templates |

---

## Tiết kiệm chi phí

| Instance Type | Giá/giờ | Tiết kiệm/tháng (150h) | Tiết kiệm/năm |
|---------------|---------|------------------------|----------------|
| t3.micro      | $0.0104 | **$1.56**              | $18.72         |
| t3.small      | $0.0208 | **$3.12**              | $37.44         |
| t3.medium     | $0.0416 | **$6.24**              | $74.88         |

> EBS volume vẫn tính phí khi EC2 tắt, nhưng nhỏ hơn nhiều so với compute cost.
