#!/bin/bash
# ============================================================
# Remove EC2 Auto Stop/Start Scheduler
# Gỡ bỏ tất cả resources đã tạo
# ============================================================

set -e

REGION="${1:-ap-southeast-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

STOP_RULE_NAME="almoney-ec2-stop-daily"
START_RULE_NAME="almoney-ec2-start-daily"
IAM_ROLE_NAME="almoney-ec2-scheduler-role"

echo "🗑️  Removing EC2 Scheduler resources..."

# Remove targets trước
echo "  Removing targets..."
aws events remove-targets --rule "$STOP_RULE_NAME" --ids "stop-ec2-target" --region "$REGION" 2>/dev/null || true
aws events remove-targets --rule "$START_RULE_NAME" --ids "start-ec2-target" --region "$REGION" 2>/dev/null || true

# Remove rules
echo "  Removing rules..."
aws events delete-rule --name "$STOP_RULE_NAME" --region "$REGION" 2>/dev/null || true
aws events delete-rule --name "$START_RULE_NAME" --region "$REGION" 2>/dev/null || true

# Detach policies từ role
echo "  Detaching policies..."
for POLICY_NAME in "almoney-ec2-scheduler-policy" "almoney-ec2-scheduler-ssm-policy"; do
    POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='${POLICY_NAME}'].Arn" --output text 2>/dev/null)
    if [ -n "$POLICY_ARN" ] && [ "$POLICY_ARN" != "None" ]; then
        aws iam detach-role-policy --role-name "$IAM_ROLE_NAME" --policy-arn "$POLICY_ARN" 2>/dev/null || true
        aws iam delete-policy --policy-arn "$POLICY_ARN" 2>/dev/null || true
        echo "    Removed policy: $POLICY_NAME"
    fi
done

# Remove role
echo "  Removing IAM role..."
aws iam delete-role --role-name "$IAM_ROLE_NAME" 2>/dev/null || true

echo ""
echo "✅ Đã gỡ bỏ tất cả EC2 Scheduler resources"
