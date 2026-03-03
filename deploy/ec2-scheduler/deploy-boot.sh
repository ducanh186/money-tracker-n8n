#!/bin/bash
# ============================================================
# Deploy boot infrastructure to EC2 via SSM (no SSH needed)
# Cập nhật boot script + systemd service lên EC2
#
# Cách dùng:
#   chmod +x deploy-boot.sh
#   ./deploy-boot.sh <INSTANCE_ID> [REGION]
# ============================================================

set -e

INSTANCE_ID="${1:?❌ Thiếu EC2 Instance ID. Dùng: ./deploy-boot.sh <INSTANCE_ID> [REGION]}"
REGION="${2:-ap-southeast-1}"

echo "============================================"
echo "  Deploy Boot Infrastructure via SSM"
echo "============================================"
echo "  Instance: $INSTANCE_ID"
echo "  Region:   $REGION"
echo "============================================"
echo ""

# Verify SSM connectivity
echo "🔍 Kiểm tra SSM connectivity..."
SSM_STATUS=$(aws ssm describe-instance-information \
    --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
    --region "$REGION" \
    --query 'InstanceInformationList[0].PingStatus' \
    --output text 2>/dev/null || echo "NotFound")

if [ "$SSM_STATUS" != "Online" ]; then
    echo "❌ Instance $INSTANCE_ID không online trên SSM (status: $SSM_STATUS)"
    echo "   Chạy setup-ssm.sh trước"
    exit 1
fi
echo "✅ SSM Online"

# Deploy: git pull + copy boot files + rebuild
echo ""
echo "🚀 Deploying..."

COMMAND_ID=$(aws ssm send-command \
    --instance-ids "$INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --timeout-seconds 300 \
    --parameters commands='[
        "set -e",
        "echo \"=== Git pull ===\"",
        "cd /opt/almoney/money-tracker && git pull origin main 2>&1",
        "",
        "echo \"=== Copy boot script ===\"",
        "cp deploy/ec2-scheduler/on-boot.sh /opt/almoney/on-boot.sh",
        "chmod +x /opt/almoney/on-boot.sh",
        "",
        "echo \"=== Update systemd service ===\"",
        "cp deploy/ec2-scheduler/almoney-boot.service /etc/systemd/system/",
        "systemctl daemon-reload",
        "systemctl enable almoney-boot.service",
        "",
        "echo \"=== Rebuild & restart API container ===\"",
        "cd /opt/almoney/money-tracker/deploy",
        "docker compose --env-file .env build --no-cache api 2>&1",
        "docker compose --env-file .env up -d --force-recreate api 2>&1",
        "",
        "echo \"=== Wait for health ===\"",
        "sleep 30",
        "docker compose ps 2>&1",
        "",
        "echo \"=== HTTP health check ===\"",
        "HTTP_CODE=$(curl -s -o /dev/null -w \"%{http_code}\" -H \"Host: almoneytracker.live\" http://localhost:8080/api/health 2>/dev/null || echo \"000\")",
        "echo \"API Health: HTTP $HTTP_CODE\"",
        "echo \"=== Deploy complete ===\""
    ]' \
    --region "$REGION" \
    --query 'Command.CommandId' \
    --output text)

echo "  Command ID: $COMMAND_ID"
echo "  ⏳ Đợi kết quả..."

# Wait for command to complete
aws ssm wait command-executed \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION" 2>/dev/null || true

sleep 5

# Get output
echo ""
echo "📋 Output:"
aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region "$REGION" \
    --query '{Status:Status, Output:StandardOutputContent, Error:StandardErrorContent}' \
    --output yaml 2>/dev/null || \
    echo "⚠️  Chưa có output (command có thể đang chạy)"

echo ""
echo "============================================"
echo "  ✅ Deploy xong!"
echo "============================================"
echo ""
echo "  Xem chi tiết:"
echo "  aws ssm get-command-invocation \\"
echo "    --command-id $COMMAND_ID \\"
echo "    --instance-id $INSTANCE_ID \\"
echo "    --region $REGION"
echo ""
