# EC2 Auto Stop/Start Scheduler

## Mục đích

Tự động tắt/bật EC2 instance để tiết kiệm chi phí trong khung giờ ít sử dụng.

| Hành động | Giờ UTC+7 | Giờ UTC | Cron (UTC) |
|-----------|-----------|---------|------------|
| 🛑 Tắt EC2 | 1:00 AM  | 18:00  | `0 18 * * ? *` |
| 🟢 Bật EC2 | 6:00 AM  | 23:00  | `0 23 * * ? *` |

**Thời gian tắt:** 5 tiếng/ngày, tất cả các ngày trong tuần.

---

## Cách cài đặt

### Yêu cầu
- AWS CLI đã cấu hình (`aws configure`)
- Quyền IAM: `iam:CreateRole`, `iam:CreatePolicy`, `events:PutRule`, `events:PutTargets`

### Trên máy local (có AWS CLI)

```bash
cd deploy/ec2-scheduler

# Cài đặt scheduler
chmod +x setup-scheduler.sh
./setup-scheduler.sh <EC2_INSTANCE_ID> <AWS_REGION>

# Ví dụ:
./setup-scheduler.sh i-0abc123def456 ap-southeast-1
```

### Trên EC2 (đảm bảo containers tự start)

```bash
# 1. Copy boot script
sudo cp on-boot.sh /opt/almoney/on-boot.sh
sudo chmod +x /opt/almoney/on-boot.sh

# 2. Cài systemd service
sudo cp almoney-boot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable almoney-boot.service

# 3. Test
sudo systemctl start almoney-boot.service
sudo journalctl -u almoney-boot.service
```

---

## Cách nó hoạt động

```
                    Timeline (UTC+7)
  ──────────────────────────────────────────────
  0:00    1:00          6:00                24:00
  ├────────┤█████████████┤──────────────────┤
           │  EC2 OFF    │
           │  (5 hours)  │
           │             │
     EventBridge    EventBridge
     STOP EC2      START EC2
                         │
                    Docker containers
                    auto-restart
                    (restart: unless-stopped)
                         │
                    Cloudflare Tunnel
                    reconnects (~30s)
                         │
                    Website available ✅
```

### Flow khi BẬT lại:
1. EventBridge trigger `AWS-StartEC2Instance` SSM Automation
2. EC2 instance starts (~30-60s)
3. Docker daemon starts
4. systemd chạy `almoney-boot.service`
5. Boot script kiểm tra & khởi động Docker containers
6. Cloudflare Tunnel tự reconnect (~30s)
7. Website hoạt động bình thường

---

## 💰 Ưu điểm

### 1. Tiết kiệm chi phí đáng kể
| Instance Type | Giá/giờ | Tiết kiệm/tháng (150h) | Tiết kiệm/năm |
|---------------|---------|------------------------|----------------|
| t3.micro      | $0.0104 | **$1.56**              | $18.72         |
| t3.small      | $0.0208 | **$3.12**              | $37.44         |
| t3.medium     | $0.0416 | **$6.24**              | $74.88         |
| t3.large      | $0.0832 | **$12.48**             | $149.76        |

> **Lưu ý:** EBS volume vẫn tính phí khi EC2 tắt, nhưng chi phí EBS nhỏ hơn nhiều so với EC2.

### 2. Không mất dữ liệu
- EBS volumes giữ nguyên data
- Docker volumes persistent (n8n data, logs)
- Chỉ RAM bị clear (không ảnh hưởng vì data trên disk)

### 3. Tự động hoàn toàn
- Không cần can thiệp thủ công
- EventBridge là serverless, không tốn thêm phí
- SSM Automation reliable và có audit trail

### 4. Dễ quản lý
- Tắt/bật scheduler dễ dàng qua AWS Console hoặc CLI
- Có script remove để gỡ hoàn toàn

---

## ⚠️ Nhược điểm & Rủi ro

### 1. Downtime 5 giờ/ngày
- **Website không truy cập được** từ 1:00 AM - 6:00 AM UTC+7
- n8n workflows không chạy trong thời gian này
- Nếu có webhook/cron job chạy lúc 1-6 AM → **sẽ bị miss**

### 2. Thời gian khởi động lại (~2-5 phút)
- EC2 boot: 30-60s
- Docker containers: 15-30s
- Cloudflare Tunnel reconnect: 15-30s
- API ready: 10-30s
- **Tổng: ~2-5 phút** sau 6:00 AM mới hoàn toàn sẵn sàng

### 3. Public IP thay đổi (nếu không dùng Elastic IP)
- Mỗi lần stop/start, Public IP sẽ **thay đổi**
- **KHÔNG ảnh hưởng** project này vì dùng Cloudflare Tunnel (kết nối outbound từ EC2)
- Nếu SSH bằng IP → cần check IP mới mỗi ngày

### 4. Elastic IP (nếu cần giữ IP)
- Elastic IP **miễn phí** khi EC2 đang chạy
- Elastic IP **tính phí** ~$3.6/tháng khi EC2 **tắt** (idle EIP)
- → Với project dùng Cloudflare Tunnel, **KHÔNG cần** Elastic IP

---

## 🐛 Lỗi có thể gặp & Cách xử lý

### 1. Docker containers không tự start
**Nguyên nhân:** Docker service chưa ready khi boot script chạy.

**Giải pháp:** Boot script đã có retry logic chờ Docker daemon.

```bash
# Kiểm tra
sudo journalctl -u almoney-boot.service

# Fix thủ công
cd /opt/almoney/money-tracker/deploy
docker compose --env-file .env up -d
```

### 2. Cloudflare Tunnel không reconnect
**Nguyên nhân:** Token expired hoặc tunnel bị xóa trên Cloudflare.

**Triệu chứng:** EC2 chạy nhưng website không truy cập được.

```bash
# Kiểm tra
docker logs almoney_cloudflared

# Fix: restart cloudflared
docker compose restart cloudflared
```

### 3. n8n workflows miss schedule
**Nguyên nhân:** n8n cron trigger chạy trong khung giờ EC2 tắt.

**Giải pháp:**
- Review tất cả n8n cron workflows
- Đảm bảo không có workflow nào chạy từ 1:00-6:00 AM UTC+7
- Hoặc dời schedule sang giờ khác

### 4. EventBridge rule không trigger
**Nguyên nhân:** IAM permissions thiếu hoặc rule bị disable.

```bash
# Kiểm tra rule status
aws events describe-rule --name almoney-ec2-stop-daily --region ap-southeast-1
aws events describe-rule --name almoney-ec2-start-daily --region ap-southeast-1

# Kiểm tra IAM role
aws iam get-role --role-name almoney-ec2-scheduler-role
```

### 5. EBS volume full sau restart
**Nguyên nhân:** Docker logs tích tụ.

```bash
# Kiểm tra disk
df -h

# Dọn Docker
docker system prune -f
docker logs almoney_api --tail 100  # Xem logs gần nhất
```

### 6. EC2 không stop được (stuck in stopping)
**Nguyên nhân:** Process trong instance không respond to shutdown.

```bash
# Force stop
aws ec2 stop-instances --instance-ids <ID> --force --region ap-southeast-1
```

---

## Quản lý scheduler

### Tắt scheduler tạm thời (VD: maintenance)
```bash
aws events disable-rule --name almoney-ec2-stop-daily --region ap-southeast-1
aws events disable-rule --name almoney-ec2-start-daily --region ap-southeast-1
```

### Bật lại scheduler
```bash
aws events enable-rule --name almoney-ec2-stop-daily --region ap-southeast-1
aws events enable-rule --name almoney-ec2-start-daily --region ap-southeast-1
```

### Thay đổi giờ
```bash
# VD: Đổi sang tắt lúc 2:00 AM UTC+7 (19:00 UTC)
aws events put-rule \
    --name almoney-ec2-stop-daily \
    --schedule-expression "cron(0 19 * * ? *)" \
    --region ap-southeast-1
```

### Gỡ bỏ hoàn toàn
```bash
chmod +x remove-scheduler.sh
./remove-scheduler.sh ap-southeast-1
```

---

## Monitoring

### CloudWatch Metrics tự động có sẵn:
- `CPUUtilization` → sẽ thấy gap 5h mỗi ngày
- `StatusCheckFailed` → check sau mỗi lần start

### Đề xuất tạo CloudWatch Alarm:
```bash
# Alarm nếu instance không start lại sau 6:15 AM UTC+7
aws cloudwatch put-metric-alarm \
    --alarm-name "almoney-ec2-not-running" \
    --metric-name StatusCheckFailed \
    --namespace AWS/EC2 \
    --statistic Maximum \
    --period 300 \
    --evaluation-periods 3 \
    --threshold 1 \
    --comparison-operator GreaterThanOrEqualToThreshold \
    --dimensions Name=InstanceId,Value=<INSTANCE_ID> \
    --alarm-actions <SNS_TOPIC_ARN> \
    --region ap-southeast-1
```
