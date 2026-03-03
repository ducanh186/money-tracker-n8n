#!/bin/bash
# ============================================================
# SSM Session Manager Setup for EC2
# Cho phép truy cập EC2 qua SSM (không cần SSH, không cần IP)
#
# Sau khi chạy xong:
#   - Vào EC2 qua AWS Console → EC2 → Connect → Session Manager
#   - Hoặc CLI: aws ssm start-session --target <INSTANCE_ID>
#   - ĐÓNG PORT 22/SSH hoàn toàn
#
# Cách dùng:
#   chmod +x setup-ssm.sh
#   ./setup-ssm.sh <INSTANCE_ID> [REGION]
# ============================================================

set -e

INSTANCE_ID="${1:?❌ Thiếu EC2 Instance ID. Dùng: ./setup-ssm.sh <INSTANCE_ID> [REGION]}"
REGION="${2:-ap-southeast-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

SSM_ROLE_NAME="almoney-ec2-ssm-role"
SSM_INSTANCE_PROFILE="almoney-ec2-ssm-profile"

echo "============================================"
echo "  SSM Session Manager Setup"
echo "============================================"
echo "  Instance:  $INSTANCE_ID"
echo "  Region:    $REGION"
echo "  Account:   $ACCOUNT_ID"
echo "============================================"
echo ""

# --- Step 1: Create IAM Role for EC2 with SSM permissions ---
echo "📋 Step 1: Tạo IAM Role cho EC2 (SSM access)..."

# Trust policy: EC2 can assume this role
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

aws iam create-role \
    --role-name "$SSM_ROLE_NAME" \
    --assume-role-policy-document "$TRUST_POLICY" \
    --description "Role for EC2 - SSM Session Manager + CloudWatch" \
    2>/dev/null && echo "  ✅ Tạo IAM Role thành công" || echo "  ℹ️  IAM Role đã tồn tại"

# Attach AWS managed policies for SSM
echo "  Attaching SSM managed policies..."
aws iam attach-role-policy \
    --role-name "$SSM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" \
    2>/dev/null && echo "  ✅ AmazonSSMManagedInstanceCore attached" || echo "  ℹ️  Already attached"

# Optional: CloudWatch for boot monitoring alerts
aws iam attach-role-policy \
    --role-name "$SSM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy" \
    2>/dev/null && echo "  ✅ CloudWatchAgentServerPolicy attached" || echo "  ℹ️  Already attached"

# --- Step 2: Create Instance Profile and attach role ---
echo ""
echo "📋 Step 2: Tạo Instance Profile..."

aws iam create-instance-profile \
    --instance-profile-name "$SSM_INSTANCE_PROFILE" \
    2>/dev/null && echo "  ✅ Instance Profile created" || echo "  ℹ️  Instance Profile đã tồn tại"

aws iam add-role-to-instance-profile \
    --instance-profile-name "$SSM_INSTANCE_PROFILE" \
    --role-name "$SSM_ROLE_NAME" \
    2>/dev/null && echo "  ✅ Role added to Instance Profile" || echo "  ℹ️  Already added"

# Wait for IAM propagation
echo "  ⏳ Chờ IAM propagation (15s)..."
sleep 15

# --- Step 3: Attach Instance Profile to EC2 ---
echo ""
echo "📋 Step 3: Gắn Instance Profile vào EC2..."

# Check if instance already has a profile
CURRENT_PROFILE=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].IamInstanceProfile.Arn' \
    --output text 2>/dev/null || echo "None")

if [ "$CURRENT_PROFILE" = "None" ] || [ -z "$CURRENT_PROFILE" ]; then
    aws ec2 associate-iam-instance-profile \
        --instance-id "$INSTANCE_ID" \
        --iam-instance-profile Name="$SSM_INSTANCE_PROFILE" \
        --region "$REGION"
    echo "  ✅ Instance Profile attached to EC2"
else
    echo "  ℹ️  EC2 already has an Instance Profile: $CURRENT_PROFILE"
    echo "  → Nếu cần đổi, chạy:"
    echo "    aws ec2 disassociate-iam-instance-profile --association-id <ASSOC_ID>"
    echo "    rồi chạy lại script này"
fi

# --- Step 4: Verify SSM Agent on EC2 ---
echo ""
echo "📋 Step 4: Kiểm tra SSM Agent..."
echo ""
echo "  SSM Agent thường được cài sẵn trên Amazon Linux 2/Ubuntu AMI."
echo "  Nếu instance không xuất hiện trong SSM Fleet Manager sau 2-3 phút,"
echo "  SSH vào và chạy:"
echo ""
echo "  # Amazon Linux 2 / AL2023:"
echo "  sudo systemctl enable amazon-ssm-agent"
echo "  sudo systemctl start amazon-ssm-agent"
echo ""
echo "  # Ubuntu:"
echo "  sudo snap install amazon-ssm-agent --classic"
echo "  sudo systemctl enable snap.amazon-ssm-agent.amazon-ssm-agent"
echo "  sudo systemctl start snap.amazon-ssm-agent.amazon-ssm-agent"
echo ""

# Wait and check SSM registration
echo "  ⏳ Đợi SSM Agent đăng ký (tối đa 60s)..."
TRIES=0
while [ "$TRIES" -lt 12 ]; do
    SSM_STATUS=$(aws ssm describe-instance-information \
        --filters "Key=InstanceIds,Values=$INSTANCE_ID" \
        --region "$REGION" \
        --query 'InstanceInformationList[0].PingStatus' \
        --output text 2>/dev/null || echo "NotFound")
    
    if [ "$SSM_STATUS" = "Online" ]; then
        echo "  ✅ SSM Agent ONLINE!"
        break
    fi
    TRIES=$((TRIES + 1))
    echo "  Waiting... ${TRIES}/12 (Status: $SSM_STATUS)"
    sleep 5
done

if [ "$SSM_STATUS" != "Online" ]; then
    echo "  ⚠️  SSM Agent chưa online. Có thể cần:"
    echo "     1. Reboot EC2 instance"
    echo "     2. Cài SSM Agent thủ công (xem ở trên)"
    echo "     3. Kiểm tra Security Group có cho phép outbound HTTPS (443) không"
fi

# --- Step 5: Hướng dẫn đóng Port 22 ---
echo ""
echo "============================================"
echo "  📋 Step 5: ĐÓNG PORT 22 (SSH)"
echo "============================================"
echo ""

# Find security groups attached to instance
SG_IDS=$(aws ec2 describe-instances \
    --instance-ids "$INSTANCE_ID" \
    --region "$REGION" \
    --query 'Reservations[0].Instances[0].SecurityGroups[*].GroupId' \
    --output text 2>/dev/null)

echo "  Security Groups của instance: $SG_IDS"
echo ""

for SG_ID in $SG_IDS; do
    # Check if SG has port 22 rule
    HAS_SSH=$(aws ec2 describe-security-group-rules \
        --filters "Name=group-id,Values=$SG_ID" \
        --region "$REGION" \
        --query "SecurityGroupRules[?FromPort==\`22\` && ToPort==\`22\` && IsEgress==\`false\`]" \
        --output text 2>/dev/null)
    
    if [ -n "$HAS_SSH" ]; then
        echo "  ⚠️  $SG_ID có inbound rule port 22"
        echo ""
        read -p "  Bạn muốn TỰ ĐỘNG xóa inbound port 22 khỏi $SG_ID? (y/N): " CONFIRM
        if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
            # Get the rule IDs for port 22 inbound
            RULE_IDS=$(aws ec2 describe-security-group-rules \
                --filters "Name=group-id,Values=$SG_ID" \
                --region "$REGION" \
                --query "SecurityGroupRules[?FromPort==\`22\` && ToPort==\`22\` && IsEgress==\`false\`].SecurityGroupRuleId" \
                --output text)
            
            for RULE_ID in $RULE_IDS; do
                aws ec2 revoke-security-group-ingress \
                    --group-id "$SG_ID" \
                    --security-group-rule-ids "$RULE_ID" \
                    --region "$REGION"
                echo "  ✅ Đã xóa SSH rule $RULE_ID khỏi $SG_ID"
            done
        else
            echo "  → Bỏ qua. Bạn có thể xóa thủ công trong AWS Console."
        fi
    else
        echo "  ✅ $SG_ID không có inbound port 22"
    fi
done

# --- Step 6: Test SSM Session ---
echo ""
echo "============================================"
echo "  🧪 Step 6: Test SSM Session"  
echo "============================================"
echo ""

if [ "$SSM_STATUS" = "Online" ]; then
    echo "  Test kết nối SSM:"
    aws ssm send-command \
        --instance-ids "$INSTANCE_ID" \
        --document-name "AWS-RunShellScript" \
        --parameters 'commands=["echo SSM_OK && uptime && docker ps --format \"table {{.Names}}\t{{.Status}}\""]' \
        --region "$REGION" \
        --query 'Command.CommandId' \
        --output text 2>/dev/null && echo "  ✅ SSM command sent successfully" || echo "  ⚠️  SSM command failed"
fi

echo ""
echo "============================================"
echo "  ✅ SSM SETUP HOÀN TẤT!"
echo "============================================"
echo ""
echo "  📌 Cách vào EC2:"
echo "     1. AWS Console → EC2 → chọn instance → Connect → Session Manager"
echo "     2. CLI: aws ssm start-session --target $INSTANCE_ID --region $REGION"
echo ""
echo "  📌 Cài Session Manager Plugin cho CLI:"
echo "     https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html"
echo ""
echo "  📌 Lưu ý:"
echo "     - EC2 cần outbound HTTPS (443) để SSM hoạt động"
echo "     - Không cần inbound port nào (kể cả 22)"
echo "     - SSM hoạt động qua AWS API → IP EC2 đổi cũng OK"
echo ""
