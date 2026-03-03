#!/bin/bash
# ============================================================
# EC2 Auto Stop/Start Scheduler Setup
# Tắt EC2 từ 1:00 AM - 6:00 AM UTC+7 hàng ngày
# (18:00 UTC - 23:00 UTC)
# ============================================================
# 
# Cách dùng:
#   chmod +x setup-scheduler.sh
#   ./setup-scheduler.sh <EC2_INSTANCE_ID> [AWS_REGION]
#
# Ví dụ:
#   ./setup-scheduler.sh i-0abc123def456 ap-southeast-1
# ============================================================

set -e

# --- Parameters ---
INSTANCE_ID="${1:?❌ Thiếu EC2 Instance ID. Dùng: ./setup-scheduler.sh <INSTANCE_ID> [REGION]}"
REGION="${2:-ap-southeast-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

STOP_RULE_NAME="almoney-ec2-stop-daily"
START_RULE_NAME="almoney-ec2-start-daily"
IAM_ROLE_NAME="almoney-ec2-scheduler-role"
IAM_POLICY_NAME="almoney-ec2-scheduler-policy"

echo "============================================"
echo "  EC2 Auto Scheduler Setup"
echo "============================================"
echo "  Instance:  $INSTANCE_ID"
echo "  Region:    $REGION"
echo "  Account:   $ACCOUNT_ID"
echo "  Stop at:   1:00 AM UTC+7 (18:00 UTC)"
echo "  Start at:  6:00 AM UTC+7 (23:00 UTC)"
echo "============================================"
echo ""

# --- Step 1: Create IAM Role for EventBridge ---
echo "📋 Step 1: Tạo IAM Role cho EventBridge..."

TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "events.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Tạo role (ignore nếu đã tồn tại)
aws iam create-role \
    --role-name "$IAM_ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Role for EventBridge to stop/start EC2 instances" \
    2>/dev/null && echo "  ✅ Tạo IAM Role thành công" || echo "  ℹ️  IAM Role đã tồn tại"

# Tạo policy cho phép stop/start EC2
EC2_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StopInstances",
        "ec2:StartInstances",
        "ec2:DescribeInstances"
      ],
      "Resource": "arn:aws:ec2:${REGION}:${ACCOUNT_ID}:instance/${INSTANCE_ID}"
    },
    {
      "Effect": "Allow",
      "Action": "ec2:DescribeInstances",
      "Resource": "*"
    }
  ]
}
EOF
)

# Tạo hoặc update policy
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${IAM_POLICY_NAME}"
aws iam create-policy \
    --policy-name "$IAM_POLICY_NAME" \
    --policy-document "$EC2_POLICY" \
    2>/dev/null && echo "  ✅ Tạo IAM Policy thành công" || echo "  ℹ️  IAM Policy đã tồn tại"

POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='${IAM_POLICY_NAME}'].Arn" --output text)

aws iam attach-role-policy \
    --role-name "$IAM_ROLE_NAME" \
    --policy-arn "$POLICY_ARN" \
    2>/dev/null && echo "  ✅ Attach policy vào role" || echo "  ℹ️  Policy đã được attach"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${IAM_ROLE_NAME}"

# Chờ IAM propagation
echo "  ⏳ Chờ IAM propagation (10s)..."
sleep 10

# --- Step 2: Tạo EventBridge Rule - STOP (1:00 AM UTC+7 = 18:00 UTC) ---
echo ""
echo "🛑 Step 2: Tạo rule TẮT EC2 lúc 1:00 AM UTC+7..."

aws events put-rule \
    --name "$STOP_RULE_NAME" \
    --schedule-expression "cron(0 18 * * ? *)" \
    --state ENABLED \
    --description "Stop EC2 instance at 1:00 AM UTC+7 (18:00 UTC) daily" \
    --region "$REGION"

echo "  ✅ Tạo rule stop thành công"

# Target: Stop EC2 instance
# EventBridge có thể gọi trực tiếp EC2 API thông qua SSM Automation
# Nhưng cách đơn giản nhất là dùng Lambda hoặc SSM
# Ở đây dùng SSM Automation document AWS-StopEC2Instance

aws events put-targets \
    --rule "$STOP_RULE_NAME" \
    --targets "[{
      \"Id\": \"stop-ec2-target\",
      \"Arn\": \"arn:aws:ssm:${REGION}::automation-definition/AWS-StopEC2Instance\",
      \"RoleArn\": \"${ROLE_ARN}\",
      \"Input\": \"{\\\"InstanceId\\\":[\\\"${INSTANCE_ID}\\\"]}\"
    }]" \
    --region "$REGION"

echo "  ✅ Gắn target stop thành công"

# --- Step 3: Tạo EventBridge Rule - START (6:00 AM UTC+7 = 23:00 UTC) ---
echo ""
echo "🟢 Step 3: Tạo rule BẬT EC2 lúc 6:00 AM UTC+7..."

aws events put-rule \
    --name "$START_RULE_NAME" \
    --schedule-expression "cron(0 23 * * ? *)" \
    --state ENABLED \
    --description "Start EC2 instance at 6:00 AM UTC+7 (23:00 UTC) daily" \
    --region "$REGION"

echo "  ✅ Tạo rule start thành công"

aws events put-targets \
    --rule "$START_RULE_NAME" \
    --targets "[{
      \"Id\": \"start-ec2-target\",
      \"Arn\": \"arn:aws:ssm:${REGION}::automation-definition/AWS-StartEC2Instance\",
      \"RoleArn\": \"${ROLE_ARN}\",
      \"Input\": \"{\\\"InstanceId\\\":[\\\"${INSTANCE_ID}\\\"]}\"
    }]" \
    --region "$REGION"

echo "  ✅ Gắn target start thành công"

# --- Step 4: Thêm SSM permissions vào IAM Role ---
echo ""
echo "🔐 Step 4: Thêm SSM permissions..."

SSM_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:StartAutomationExecution",
        "ssm:GetAutomationExecution"
      ],
      "Resource": [
        "arn:aws:ssm:${REGION}::automation-definition/AWS-StopEC2Instance:*",
        "arn:aws:ssm:${REGION}::automation-definition/AWS-StartEC2Instance:*",
        "arn:aws:ssm:${REGION}:${ACCOUNT_ID}:automation-execution/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "${ROLE_ARN}"
    }
  ]
}
EOF
)

SSM_POLICY_NAME="almoney-ec2-scheduler-ssm-policy"
aws iam create-policy \
    --policy-name "$SSM_POLICY_NAME" \
    --policy-document "$SSM_POLICY" \
    2>/dev/null && echo "  ✅ Tạo SSM Policy thành công" || echo "  ℹ️  SSM Policy đã tồn tại"

SSM_POLICY_ARN=$(aws iam list-policies --query "Policies[?PolicyName=='${SSM_POLICY_NAME}'].Arn" --output text)

aws iam attach-role-policy \
    --role-name "$IAM_ROLE_NAME" \
    --policy-arn "$SSM_POLICY_ARN"

echo "  ✅ Attach SSM policy thành công"

# --- Step 5: Verify ---
echo ""
echo "🔍 Step 5: Kiểm tra cấu hình..."
echo ""

echo "📌 EventBridge Rules:"
aws events list-rules \
    --name-prefix "almoney-ec2" \
    --region "$REGION" \
    --query "Rules[].{Name:Name,State:State,Schedule:ScheduleExpression}" \
    --output table

echo ""
echo "============================================"
echo "  ✅ SETUP HOÀN TẤT!"
echo "============================================"
echo ""
echo "  🛑 TẮT EC2:  Hàng ngày lúc 1:00 AM UTC+7"
echo "  🟢 BẬT EC2:  Hàng ngày lúc 6:00 AM UTC+7"
echo "  💰 Tiết kiệm: ~5 giờ/ngày × 30 ngày = ~150 giờ/tháng"
echo ""
echo "  Xem logs:"
echo "    aws events describe-rule --name $STOP_RULE_NAME --region $REGION"
echo "    aws events describe-rule --name $START_RULE_NAME --region $REGION"
echo ""
echo "  Tắt tạm thời:"
echo "    aws events disable-rule --name $STOP_RULE_NAME --region $REGION"
echo "    aws events disable-rule --name $START_RULE_NAME --region $REGION"
echo ""
echo "  Bật lại:"
echo "    aws events enable-rule --name $STOP_RULE_NAME --region $REGION"
echo "    aws events enable-rule --name $START_RULE_NAME --region $REGION"
echo ""
