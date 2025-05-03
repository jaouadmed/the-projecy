# DoliPaaS VM Deployment Guide

This guide provides comprehensive instructions for deploying the DoliPaaS platform exclusively on a Contabo Virtual Machine, with no local machine dependencies. All operations, including setup, configuration, and management, will be performed directly on the VM.

## Prerequisites

- Contabo VPS account
- SSH client (to connect to your VM)
- Domain name (optional but recommended)

## 1. Initial VM Setup

### 1.1 Provision a New VM

1. Log in to your Contabo control panel
2. Order a new VPS with the following specifications:
   - Minimum 4 vCPU cores
   - 8GB RAM minimum (16GB recommended)
   - 100GB SSD storage minimum
   - Ubuntu Server 22.04 LTS

### 1.2 Connect to Your VM

```bash
# Connect via SSH (replace with your VM's IP address)
ssh root@your_vm_ip
```

### 1.3 Initial Server Configuration

```bash
# Update system packages
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git vim htop net-tools ufw

# Configure firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 80  # For Dolibarr web interface
ufw enable

# Set timezone
timedatectl set-timezone UTC
```

### 1.4 Create a Non-root User (Optional but Recommended)

```bash
# Create a new user
adduser dolipaas

# Add user to sudo group
usermod -aG sudo dolipaas

# Switch to the new user
su - dolipaas
```

## 2. Docker Installation

### 2.1 Install Docker

```bash
# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Set up the stable repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add your user to the docker group
sudo usermod -aG docker $USER

# Apply group changes (or log out and back in)
newgrp docker
```

### 2.2 Install Docker Compose

```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

## 3. DoliPaaS Platform Deployment

### 3.1 Create Project Directory Structure

```bash
# Create directory for the project
sudo mkdir -p /opt/dolipaas
sudo chown $USER:$USER /opt/dolipaas
cd /opt/dolipaas

# Create necessary subdirectories
mkdir -p infrastructure/docker/dolibarr/conf
```

### 3.2 Configure Dolibarr

Create the Dolibarr configuration file:

```bash
cat > infrastructure/docker/dolibarr/conf/dolibarr.conf << 'EOF'
# Dolibarr environment variables
# Database configuration
MARIADB_HOST=db
MARIADB_PORT=3306
MARIADB_NAME=${DB_NAME}
MARIADB_USER=${DB_USER}
MARIADB_PASSWORD=${DB_PASSWORD}
MARIADB_ROOT_PASSWORD=${DB_ROOT_PASSWORD}

# Dolibarr configuration
DOLIBARR_ADMIN_LOGIN=${ADMIN_LOGIN}
DOLIBARR_ADMIN_PASSWORD=${ADMIN_PASSWORD}
DOLIBARR_URL_ROOT=${URL_ROOT}

# PHP configuration
PHP_INI_DATE_TIMEZONE=${PHP_TIMEZONE}
PHP_INI_MEMORY_LIMIT=${PHP_MEMORY_LIMIT}
PHP_INI_UPLOAD_MAX_FILESIZE=${PHP_UPLOAD_MAX_FILESIZE}
PHP_INI_POST_MAX_SIZE=${PHP_POST_MAX_SIZE}

# Email configuration
DOLIBARR_MAIL_HOST=${MAIL_HOST}
DOLIBARR_MAIL_PORT=${MAIL_PORT}
DOLIBARR_MAIL_USER=${MAIL_USER}
DOLIBARR_MAIL_PASS=${MAIL_PASSWORD}
DOLIBARR_MAIL_ENCRYPTION=${MAIL_ENCRYPTION}
DOLIBARR_MAIL_FROM=${MAIL_FROM}
EOF
```

### 3.3 Create Docker Compose File

Create the Docker Compose file for Dolibarr:

```bash
cat > infrastructure/docker/dolibarr/docker-compose.yml << 'EOF'
version: '3.8'

services:
  dolibarr:
    image: tuxgasy/dolibarr:latest
    restart: always
    environment:
      - DOLI_DB_HOST=db
      - DOLI_DB_PORT=3306
      - DOLI_DB_NAME=${DB_NAME:-dolibarr}
      - DOLI_DB_USER=${DB_USER:-dolibarr}
      - DOLI_DB_PASSWORD=${DB_PASSWORD:-dolibarr_password}
      - DOLI_ADMIN_LOGIN=${ADMIN_LOGIN:-admin}
      - DOLI_ADMIN_PASSWORD=${ADMIN_PASSWORD:-admin}
      - DOLI_URL_ROOT=${URL_ROOT:-http://localhost}
      - PHP_INI_DATE_TIMEZONE=${PHP_TIMEZONE:-UTC}
      - PHP_INI_MEMORY_LIMIT=${PHP_MEMORY_LIMIT:-256M}
      - PHP_INI_UPLOAD_MAX_FILESIZE=${PHP_UPLOAD_MAX_FILESIZE:-10M}
      - PHP_INI_POST_MAX_SIZE=${PHP_POST_MAX_SIZE:-10M}
      - DOLI_MAIL_HOST=${MAIL_HOST:-}
      - DOLI_MAIL_PORT=${MAIL_PORT:-25}
      - DOLI_MAIL_USER=${MAIL_USER:-}
      - DOLI_MAIL_PASS=${MAIL_PASSWORD:-}
      - DOLI_MAIL_ENCRYPTION=${MAIL_ENCRYPTION:-}
      - DOLI_MAIL_FROM=${MAIL_FROM:-}
    ports:
      - "${HOST_PORT:-80}:80"
    volumes:
      - dolibarr_data:/var/www/documents
      - dolibarr_html:/var/www/html
    depends_on:
      - db
    networks:
      - dolibarr_network

  db:
    image: mariadb:10.6
    restart: always
    environment:
      - MYSQL_DATABASE=${DB_NAME:-dolibarr}
      - MYSQL_USER=${DB_USER:-dolibarr}
      - MYSQL_PASSWORD=${DB_PASSWORD:-dolibarr_password}
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-root_password}
    volumes:
      - dolibarr_db:/var/lib/mysql
    networks:
      - dolibarr_network

volumes:
  dolibarr_data:
    name: ${INSTANCE_NAME:-dolibarr}_data
  dolibarr_html:
    name: ${INSTANCE_NAME:-dolibarr}_html
  dolibarr_db:
    name: ${INSTANCE_NAME:-dolibarr}_db

networks:
  dolibarr_network:
    name: ${INSTANCE_NAME:-dolibarr}_network
EOF
```

### 3.4 Create Environment File

```bash
cat > infrastructure/docker/dolibarr/.env << 'EOF'
# Instance Configuration
INSTANCE_NAME=dolipaas
HOST_PORT=80

# Database Configuration
DB_USER=dolibarr
DB_PASSWORD=secure_password_here
DB_NAME=dolibarr
DB_ROOT_PASSWORD=secure_root_password_here

# Dolibarr Configuration
ADMIN_LOGIN=admin
ADMIN_PASSWORD=secure_admin_password_here
URL_ROOT=http://localhost

# PHP Configuration
PHP_TIMEZONE=UTC
PHP_MEMORY_LIMIT=256M
PHP_UPLOAD_MAX_FILESIZE=10M
PHP_POST_MAX_SIZE=10M

# Email Configuration
MAIL_HOST=
MAIL_PORT=25
MAIL_USER=
MAIL_PASSWORD=
MAIL_ENCRYPTION=
MAIL_FROM=
EOF
```

### 3.5 Deploy the Application

```bash
cd /opt/dolipaas/infrastructure/docker/dolibarr

# Start the application
docker-compose up -d

# Check if containers are running
docker-compose ps
```

> **Note**: If you encounter a port conflict error (e.g., "address already in use"), it means port 80 is already being used by another service. See the [Troubleshooting](#port-conflict-error) section for solutions.

## 4. Nginx Reverse Proxy Setup (Optional)

If you want to use a domain name and HTTPS:

### 4.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 4.2 Configure Nginx as a Reverse Proxy

Create a new Nginx configuration file:

```bash
sudo vim /etc/nginx/sites-available/dolipaas
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/dolipaas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4.3 Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Follow the prompts to complete the setup
```

## 5. Remote Management

### 5.1 Monitoring the Application

```bash
# View container logs
docker-compose logs -f

# Check container status
docker-compose ps

# View resource usage
docker stats
```

### 5.2 Backup and Restore

Create a backup script:

```bash
cat > /opt/dolipaas/backup.sh << 'EOF'
#!/bin/bash

# Set variables
BACKUP_DIR="/opt/dolipaas/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/dolipaas_backup_${TIMESTAMP}.tar.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Stop containers
cd /opt/dolipaas/infrastructure/docker/dolibarr
docker-compose down

# Backup volumes
tar -czf "${BACKUP_FILE}" -C /var/lib/docker/volumes .

# Restart containers
docker-compose up -d

echo "Backup completed: ${BACKUP_FILE}"
EOF

chmod +x /opt/dolipaas/backup.sh
```

Create a restore script:

```bash
cat > /opt/dolipaas/restore.sh << 'EOF'
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
cd /opt/dolipaas/infrastructure/docker/dolibarr
docker-compose down

# Restore volumes
sudo tar -xzf "${BACKUP_FILE}" -C /var/lib/docker/volumes

# Restart containers
docker-compose up -d

echo "Restore completed from: ${BACKUP_FILE}"
EOF

chmod +x /opt/dolipaas/restore.sh
```

### 5.3 Scheduled Backups

Set up a cron job for automated backups:

```bash
# Edit crontab
crontab -e

# Add the following line to run backup daily at 2 AM
0 2 * * * /opt/dolipaas/backup.sh
```

## 6. Accessing the Application

After deployment, you can access the DoliPaaS platform through:

- Direct access: http://your_vm_ip
- Domain access (if configured): https://your-domain.com

### 6.1 Initial Setup

1. Navigate to the URL in your browser
2. Log in with the admin credentials set in the .env file
3. Complete the initial setup wizard

## 7. Troubleshooting

### 7.1 Common Issues

#### Container Fails to Start

```bash
# Check container logs
docker-compose logs dolibarr

# Verify environment variables
cat .env

# Check if ports are already in use
sudo netstat -tulpn | grep 80
```

#### Port Conflict Error

If you encounter this error when starting the application:

```
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on endpoint dolibarr-dolibarr-1: failed to bind host port for 0.0.0.0:80:172.18.0.3:80/tcp: address already in use
```

This means port 80 is already in use by another process. Here are several solutions:

1. **Change the HOST_PORT in the .env file**:

```bash
# Edit the .env file
vim .env

# Change HOST_PORT from 80 to another port (e.g., 8080)
HOST_PORT=8080

# Restart the application
docker-compose up -d
```

2. **Identify and stop the conflicting service**:

```bash
# Find out which process is using port 80
sudo netstat -tulpn | grep :80

# If it's Apache, you can stop it with
sudo systemctl stop apache2

# If it's Nginx, you can stop it with
sudo systemctl stop nginx

# Then try starting your application again
docker-compose up -d
```

3. **Use Nginx as a reverse proxy** (as described in Section 4) and change the DoliPaaS container to use a different port internally.

#### Database Connection Issues

```bash
# Check if database container is running
docker-compose ps db

# Check database logs
docker-compose logs db

# Verify database credentials in .env file
cat .env
```

#### Permission Issues

```bash
# Fix volume permissions
docker-compose down
sudo chown -R 33:33 /var/lib/docker/volumes/dolipaas_dolibarr_data
sudo chown -R 999:999 /var/lib/docker/volumes/dolipaas_dolibarr_db
docker-compose up -d
```

## 8. Updating the Application

```bash
cd /opt/dolipaas/infrastructure/docker/dolibarr

# Pull latest changes (if using git)
git pull

# Rebuild and restart containers
docker-compose down
docker-compose pull
docker-compose up -d
```

## Conclusion

You have successfully deployed the DoliPaaS platform on a Contabo VM with no local machine dependencies. All operations, including setup, configuration, and management, are performed directly on the VM. The platform is now ready to use.

For additional support or to report issues, please refer to the project documentation or contact the support team.