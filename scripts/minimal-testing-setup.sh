#!/bin/bash

# DoliPaaS Minimal Testing Environment Setup Script
# This script automates the setup of a minimal testing environment for Dolibarr deployments on Contabo VMs

echo "=== DoliPaaS Minimal Testing Environment Setup ==="
echo "This script will set up the minimal environment needed for testing Dolibarr deployments."
echo ""

# Update system packages
echo "[1/8] Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential tools
echo "[2/8] Installing essential tools..."
sudo apt install -y curl wget git vim htop net-tools ufw

# Configure firewall
echo "[3/8] Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw --force enable

# Install Docker
echo "[4/8] Installing Docker..."
sudo apt install -y apt-transport-https ca-certificates gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER

# Install Docker Compose
echo "[5/8] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create project directory
echo "[6/8] Creating project directory..."
mkdir -p /opt/dolipaas
cd /opt/dolipaas

# Create minimal docker-compose file for Dolibarr
echo "[7/8] Creating Docker Compose configuration for Dolibarr..."
cat > docker-compose.yml << 'EOF'
version: '3'

services:
  mariadb:
    image: mariadb:10.6
    container_name: dolibarr-db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-rootpassword}
      MYSQL_DATABASE: ${DB_NAME:-dolibarr}
      MYSQL_USER: ${DB_USER:-dolibarr}
      MYSQL_PASSWORD: ${DB_PASSWORD:-dolibarrpassword}
    volumes:
      - db_data:/var/lib/mysql
    networks:
      - dolibarr-network

  dolibarr:
    image: tuxgasy/dolibarr:latest
    container_name: dolibarr-app
    restart: always
    depends_on:
      - mariadb
    environment:
      DOLI_DB_HOST: mariadb
      DOLI_DB_USER: ${DB_USER:-dolibarr}
      DOLI_DB_PASSWORD: ${DB_PASSWORD:-dolibarrpassword}
      DOLI_DB_NAME: ${DB_NAME:-dolibarr}
      DOLI_URL_ROOT: 'http://localhost'
      DOLI_ADMIN_LOGIN: ${ADMIN_LOGIN:-admin}
      DOLI_ADMIN_PASSWORD: ${ADMIN_PASSWORD:-admin}
      DOLI_MODULES: 'modSociete,modExpedition,modFacture,modProduct,modService,modStock'
    ports:
      - "${DOLIBARR_PORT:-8080}:80"
    volumes:
      - dolibarr_data:/var/www/documents
    networks:
      - dolibarr-network

networks:
  dolibarr-network:

volumes:
  db_data:
  dolibarr_data:
EOF

# Create environment file
cat > .env << 'EOF'
# Database Configuration
DB_ROOT_PASSWORD=rootpassword
DB_NAME=dolibarr
DB_USER=dolibarr
DB_PASSWORD=dolibarrpassword

# Dolibarr Configuration
DOLIBARR_PORT=8080
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin
EOF

# Create basic monitoring script
echo "[8/8] Creating basic monitoring script..."
cat > monitor.sh << 'EOF'
#!/bin/bash

echo "=== DoliPaaS Minimal Monitoring ==="
echo "Checking container status and resource usage..."
echo ""

echo "Container Status:"
docker ps -a | grep dolibarr
echo ""

echo "Container Resource Usage:"
docker stats --no-stream dolibarr-app dolibarr-db
echo ""

echo "Disk Usage:"
df -h /opt/dolipaas
echo ""

echo "Container Logs (last 10 lines):"
echo "--- Dolibarr App Logs ---"
docker logs --tail 10 dolibarr-app
echo ""
echo "--- MariaDB Logs ---"
docker logs --tail 10 dolibarr-db
EOF

chmod +x monitor.sh

echo ""
echo "=== Setup Complete! ==="
echo "To start Dolibarr, run: docker-compose up -d"
echo "To monitor the deployment, run: ./monitor.sh"
echo "Dolibarr will be available at: http://YOUR_SERVER_IP:8080"
echo "Default admin credentials: admin / admin"
echo ""
echo "This is a minimal testing environment. For production use, additional security measures are required."