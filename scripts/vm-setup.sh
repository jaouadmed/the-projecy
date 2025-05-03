#!/bin/bash

# DoliPaaS VM Setup Script
# This script automates the deployment of DoliPaaS on a Contabo VM
# Run as root or with sudo privileges

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if script is run as root
if [ "$(id -u)" -ne 0 ]; then
  print_error "This script must be run as root or with sudo privileges"
  exit 1
fi

# Variables
DOLIPAAS_DIR="/opt/dolipaas"
DOCKER_COMPOSE_VERSION="2.18.1"

# 1. Initial Server Setup
print_message "Starting initial server setup..."

# Update system packages
print_message "Updating system packages..."
apt update && apt upgrade -y

# Install essential tools
print_message "Installing essential tools..."
apt install -y curl wget git vim htop net-tools ufw

# Configure firewall
print_message "Configuring firewall..."
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 8069  # For Odoo web interface
ufw --force enable

# Set timezone
print_message "Setting timezone to UTC..."
timedatectl set-timezone UTC

# 2. Docker Installation
print_message "Installing Docker..."

# Install prerequisites
apt install -y apt-transport-https ca-certificates gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
apt update
apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
print_message "Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Verify Docker installation
docker --version
docker-compose --version

# 3. Create DoliPaaS User (Optional)
read -p "Do you want to create a dedicated user for DoliPaaS? (y/n): " CREATE_USER
if [[ "$CREATE_USER" =~ ^[Yy]$ ]]; then
  read -p "Enter username (default: dolipaas): " USERNAME
  USERNAME=${USERNAME:-dolipaas}
  
  print_message "Creating user ${USERNAME}..."
  adduser --gecos "" ${USERNAME}
  usermod -aG sudo ${USERNAME}
  usermod -aG docker ${USERNAME}
  
  # Set ownership of DoliPaaS directory
  mkdir -p ${DOLIPAAS_DIR}
  chown -R ${USERNAME}:${USERNAME} ${DOLIPAAS_DIR}
  
  print_message "User ${USERNAME} created and added to sudo and docker groups"
else
  print_message "Skipping user creation"
  mkdir -p ${DOLIPAAS_DIR}
fi

# 4. DoliPaaS Platform Deployment
print_message "Setting up DoliPaaS platform..."

# Create directory structure
mkdir -p ${DOLIPAAS_DIR}/infrastructure/docker/odoo/conf

# Create Odoo configuration file
print_message "Creating Odoo configuration file..."
cat > ${DOLIPAAS_DIR}/infrastructure/docker/odoo/conf/odoo.conf << 'EOF'
[options]
# General Settings
admin_passwd = ${ADMIN_PASSWORD}
db_host = ${DB_HOST}
db_port = ${DB_PORT}
db_user = ${DB_USER}
db_password = ${DB_PASSWORD}
db_name = ${DB_NAME}
db_maxconn = 64
db_template = template0

# HTTP Service Configuration
http_interface = 0.0.0.0
http_port = 8069
proxy_mode = ${PROXY_MODE}
gevent_port = 8072
longpolling_port = 8072
workers = ${WORKERS}
limit_time_cpu = 600
limit_time_real = 1200
max_cron_threads = 2

# Logging Configuration
logfile = /var/log/odoo/odoo.log
log_level = info
log_handler = :INFO

# Addons Path
addons_path = /mnt/extra-addons,/usr/lib/python3/dist-packages/odoo/addons

# Data Directories
data_dir = /var/lib/odoo

# Security Settings
list_db = ${LIST_DB}
without_demo = ${WITHOUT_DEMO}

# Performance Tuning
osv_memory_count_limit = ${OSV_MEMORY_COUNT_LIMIT}
osv_memory_age_limit = ${OSV_MEMORY_AGE_LIMIT}

# Email Configuration
smtp_server = ${SMTP_SERVER}
smtp_port = ${SMTP_PORT}
smtp_user = ${SMTP_USER}
smtp_password = ${SMTP_PASSWORD}
smtp_ssl = ${SMTP_SSL}
email_from = ${EMAIL_FROM}
EOF

# Create Docker Compose file
print_message "Creating Docker Compose file..."
cat > ${DOLIPAAS_DIR}/infrastructure/docker/odoo/docker-compose.yml << 'EOF'
version: '3.8'

services:
  odoo:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=${DB_USER:-odoo}
      - DB_PASSWORD=${DB_PASSWORD:-odoo_password}
      - DB_NAME=${DB_NAME:-odoo}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin}
      - PROXY_MODE=${PROXY_MODE:-False}
      - WORKERS=${WORKERS:-2}
      - LIST_DB=${LIST_DB:-True}
      - WITHOUT_DEMO=${WITHOUT_DEMO:-True}
      - OSV_MEMORY_COUNT_LIMIT=${OSV_MEMORY_COUNT_LIMIT:-False}
      - OSV_MEMORY_AGE_LIMIT=${OSV_MEMORY_AGE_LIMIT:-1.0}
      - SMTP_SERVER=${SMTP_SERVER:-}
      - SMTP_PORT=${SMTP_PORT:-25}
      - SMTP_USER=${SMTP_USER:-}
      - SMTP_PASSWORD=${SMTP_PASSWORD:-}
      - SMTP_SSL=${SMTP_SSL:-False}
      - EMAIL_FROM=${EMAIL_FROM:-}
    ports:
      - "${HOST_PORT:-8069}:8069"
    volumes:
      - odoo_data:/var/lib/odoo
      - odoo_addons:/mnt/extra-addons
    depends_on:
      - db
    networks:
      - odoo_network

  db:
    image: postgres:13
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER:-odoo}
      - POSTGRES_PASSWORD=${DB_PASSWORD:-odoo_password}
      - POSTGRES_DB=${DB_NAME:-odoo}
    volumes:
      - odoo_db:/var/lib/postgresql/data
    networks:
      - odoo_network

volumes:
  odoo_data:
    name: ${INSTANCE_NAME:-odoo}_data
  odoo_addons:
    name: ${INSTANCE_NAME:-odoo}_addons
  odoo_db:
    name: ${INSTANCE_NAME:-odoo}_db

networks:
  odoo_network:
    name: ${INSTANCE_NAME:-odoo}_network
EOF

# Create Dockerfile
print_message "Creating Dockerfile..."
cat > ${DOLIPAAS_DIR}/infrastructure/docker/odoo/Dockerfile << 'EOF'
FROM odoo:16.0

USER root

# Install additional dependencies if needed
RUN apt-get update && apt-get install -y \
    python3-pip \
    libldap2-dev \
    libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies if needed
RUN pip3 install python-ldap

# Create log directory with proper permissions
RUN mkdir -p /var/log/odoo && chown -R odoo:odoo /var/log/odoo

# Switch back to odoo user
USER odoo
EOF

# Create environment file
print_message "Creating environment file..."
cat > ${DOLIPAAS_DIR}/infrastructure/docker/odoo/.env << 'EOF'
# Instance Configuration
INSTANCE_NAME=dolipaas
HOST_PORT=8069

# Database Configuration
DB_USER=odoo
DB_PASSWORD=secure_password_here
DB_NAME=dolipaas

# Odoo Configuration
ADMIN_PASSWORD=secure_admin_password_here
PROXY_MODE=False
WORKERS=2
LIST_DB=False
WITHOUT_DEMO=True

# Performance Settings
OSV_MEMORY_COUNT_LIMIT=False
OSV_MEMORY_AGE_LIMIT=1.0

# Email Configuration
SMTP_SERVER=
SMTP_PORT=25
SMTP_USER=
SMTP_PASSWORD=
SMTP_SSL=False
EMAIL_FROM=
EOF

# Create backup script
print_message "Creating backup script..."
cat > ${DOLIPAAS_DIR}/backup.sh << 'EOF'
#!/bin/bash

# Set variables
BACKUP_DIR="/opt/dolipaas/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dolipaas_backup_${TIMESTAMP}.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Stop containers
cd /opt/dolipaas/infrastructure/docker/odoo
docker-compose down

# Backup volumes
tar -czf "${BACKUP_FILE}" -C /var/lib/docker/volumes .

# Restart containers
docker-compose up -d

echo "Backup completed: ${BACKUP_FILE}"
EOF
chmod +x ${DOLIPAAS_DIR}/backup.sh

# Create restore script
print_message "Creating restore script..."
cat > ${DOLIPAAS_DIR}/restore.sh << 'EOF'
#!/bin/bash

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "${BACKUP_FILE}" ]; then
    echo "Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

# Stop containers
cd /opt/dolipaas/infrastructure/docker/odoo
docker-compose down

# Restore volumes
sudo tar -xzf "${BACKUP_FILE}" -C /var/lib/docker/volumes

# Restart containers
docker-compose up -d

echo "Restore completed from: ${BACKUP_FILE}"
EOF
chmod +x ${DOLIPAAS_DIR}/restore.sh

# 5. Deploy Application (Optional)
read -p "Do you want to deploy the application now? (y/n): " DEPLOY_NOW
if [[ "$DEPLOY_NOW" =~ ^[Yy]$ ]]; then
  print_message "Deploying DoliPaaS application..."
  cd ${DOLIPAAS_DIR}/infrastructure/docker/odoo
  docker-compose up -d
  print_message "DoliPaaS application deployed successfully!"
else
  print_message "Skipping deployment. You can deploy later with:"
  echo "  cd ${DOLIPAAS_DIR}/infrastructure/docker/odoo"
  echo "  docker-compose up -d"
fi

# 6. Setup Nginx (Optional)
read -p "Do you want to set up Nginx as a reverse proxy? (y/n): " SETUP_NGINX
if [[ "$SETUP_NGINX" =~ ^[Yy]$ ]]; then
  print_message "Installing Nginx..."
  apt install -y nginx
  
  read -p "Enter your domain name: " DOMAIN_NAME
  
  print_message "Creating Nginx configuration..."
  cat > /etc/nginx/sites-available/dolipaas << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    location / {
        proxy_pass http://localhost:8069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  
  ln -s /etc/nginx/sites-available/dolipaas /etc/nginx/sites-enabled/
  nginx -t
  systemctl restart nginx
  
  read -p "Do you want to set up SSL with Let's Encrypt? (y/n): " SETUP_SSL
  if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
    print_message "Installing Certbot..."
    apt install -y certbot python3-certbot-nginx
    
    print_message "Obtaining SSL certificate..."
    certbot --nginx -d ${DOMAIN_NAME}
  fi
fi

print_message "DoliPaaS setup completed successfully!"
print_message "You can access the application at:"
echo "  - http://your_server_ip:8069"

if [[ "$SETUP_NGINX" =~ ^[Yy]$ ]]; then
  if [[ "$SETUP_SSL" =~ ^[Yy]$ ]]; then
    echo "  - https://${DOMAIN_NAME}"
  else
    echo "  - http://${DOMAIN_NAME}"
  fi
fi

print_message "For more information, refer to the VM deployment guide."