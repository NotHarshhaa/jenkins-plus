#!/usr/bin/env bash
# user_data.sh.tpl — bootstrap script for jenkins-plus on Amazon Linux 2023
# Rendered by Terraform templatefile(); variables: admin_password, github_org,
# jenkins_url, ebs_device

set -euo pipefail
exec > >(tee /var/log/jenkins-plus-init.log | logger -t jenkins-plus-init) 2>&1

echo "=== jenkins-plus bootstrap starting ==="

# ── 1. System update ──────────────────────────────────────────────────────────
dnf update -y
dnf install -y docker git curl unzip jq

# ── 2. Docker ─────────────────────────────────────────────────────────────────
systemctl enable docker
systemctl start docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Install docker compose plugin
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── 3. Mount EBS volume for jenkins_home ──────────────────────────────────────
EBS_DEVICE="${ebs_device}"
MOUNT_POINT="/var/jenkins_home"

mkdir -p "$MOUNT_POINT"

# Wait for the EBS device to become available (udev-based retry loop)
echo "Waiting for EBS device $EBS_DEVICE ..."
attempt=0
max_attempts=30
until [ -b "$EBS_DEVICE" ] || [ $attempt -ge $max_attempts ]; do
    echo "  Device not ready yet (attempt $attempt/$max_attempts), sleeping 5s ..."
    sleep 5
    attempt=$(( attempt + 1 ))
done

if [ ! -b "$EBS_DEVICE" ]; then
    echo "ERROR: EBS device $EBS_DEVICE did not appear after $(( max_attempts * 5 ))s"
    exit 1
fi

# Format only if the volume has no filesystem yet
if ! blkid "$EBS_DEVICE" &>/dev/null; then
    echo "Formatting $EBS_DEVICE as ext4 ..."
    mkfs.ext4 -F "$EBS_DEVICE"
fi

# Add to fstab for persistence across reboots
if ! grep -q "$EBS_DEVICE" /etc/fstab; then
    echo "$EBS_DEVICE  $MOUNT_POINT  ext4  defaults,nofail  0  2" >> /etc/fstab
fi

mount -a
chown -R 1000:1000 "$MOUNT_POINT"
echo "EBS volume mounted at $MOUNT_POINT"

# ── 4. Write .env file ────────────────────────────────────────────────────────
cat > /opt/jenkins-plus/.env <<'ENV_EOF'
ADMIN_USER=admin
ADMIN_PASSWORD=${admin_password}
ADMIN_EMAIL=admin@example.com
JENKINS_URL=${jenkins_url}
GITHUB_ORG=${github_org}
GRAFANA_PASSWORD=admin
NEXT_PUBLIC_JENKINS_URL=${jenkins_url}
NEXT_PUBLIC_APP_NAME=jenkins-plus
ENV_EOF

chmod 600 /opt/jenkins-plus/.env

# ── 5. Write docker-compose.yml ───────────────────────────────────────────────
mkdir -p /opt/jenkins-plus
cat > /opt/jenkins-plus/docker-compose.yml <<'COMPOSE_EOF'
version: "3.9"
services:
  jenkins-plus:
    image: notharshaa/jenkins-plus:latest
    container_name: jenkins-plus
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - /var/jenkins_home:/var/jenkins_home
    env_file: /opt/jenkins-plus/.env
    healthcheck:
      test: ["CMD", "curl", "-sf", "http://localhost:8080/login"]
      interval: 30s
      timeout: 10s
      start_period: 90s
      retries: 5

  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - prometheus-data:/prometheus
    command:
      - --storage.tsdb.retention.time=30d
      - --web.enable-lifecycle

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus-data:
  grafana-data:
COMPOSE_EOF

# ── 6. Pull image and start stack ─────────────────────────────────────────────
cd /opt/jenkins-plus
docker pull notharshaa/jenkins-plus:latest
docker compose up -d

# ── 7. Install CloudWatch agent ───────────────────────────────────────────────
dnf install -y amazon-cloudwatch-agent

cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'CWA_EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/jenkins-plus-init.log",
            "log_group_name": "/ec2/jenkins-plus/init",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30
          },
          {
            "file_path": "/var/jenkins_home/logs/hudson.log",
            "log_group_name": "/ec2/jenkins-plus/jenkins",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 30
          }
        ]
      }
    }
  }
}
CWA_EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

echo "=== jenkins-plus bootstrap complete ==="
