# DoliPaaS Deployment Guide for Contabo VMs

This guide provides detailed instructions for deploying the DoliPaaS platform on Contabo Virtual Machines. It covers initial setup, environment configuration, and application deployment.

## Prerequisites

- Contabo VPS account
- SSH access to your VM
- Domain name (optional but recommended)
- Basic knowledge of Linux commands

## 1. Initial VM Setup

### 1.1 Provision a New VM

1. Log in to your Contabo control panel
2. Order a new VPS with the following specifications:
   - Minimum 4 vCPU cores
   - 8GB RAM minimum (16GB recommended)
   - 100GB SSD storage minimum
   - Ubuntu Server 22.04 LTS

### 1.2 Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git vim htop net-tools ufw

# Configure firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Set timezone
sudo timedatectl set-timezone UTC
```

### 1.3 Create a Non-root User (Optional but Recommended)

```bash
# Create a new user
sudo adduser dolipaas

# Add user to sudo group
sudo usermod -aG sudo dolipaas

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

### 3.1 Clone the Repository

```bash
# Create directory for the project
mkdir -p /opt/dolipaas
cd /opt/dolipaas

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/yourusername/dolipaas.git .
```

### 3.2 Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit the environment file with your settings
vim .env
```

Update the following variables in the .env file:

```
# Database Configuration
DB_HOST=db
DB_PORT=3306
DB_NAME=dolipaas
DB_USER=dolipaas
DB_PASSWORD=your_secure_password

# Application Configuration
APP_URL=https://your-domain.com
APP_PORT=3000

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# Docker Configuration
DOCKER_SOCKET=/var/run/docker.sock
```

### 3.3 Deploy with Docker Compose

```bash
# Start the application
docker-compose up -d

# Check if containers are running
docker-compose ps
```

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
        proxy_pass http://localhost:3000;
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

## 5. Testing the Deployment

### 5.1 Verify Services

```bash
# Check if all containers are running
docker ps

# Check application logs
docker-compose logs -f app
```

### 5.2 Access the Application

Open your browser and navigate to:
- http://your-server-ip:3000 (if not using Nginx)
- https://your-domain.com (if using Nginx with SSL)

## 6. Deploying Dolibarr

Once the DoliPaaS platform is running, you can deploy Dolibarr through the web interface:

1. Register an account or log in to the DoliPaaS dashboard
2. Click on "Deploy New Application"
3. Select "Dolibarr" from the application list
4. Configure the deployment options:
   - Instance name
   - Admin username and password
   - Database configuration (if custom options are needed)
5. Click "Deploy" and wait for the deployment to complete

## 7. Maintenance and Monitoring

### 7.1 Regular Updates

```bash
# Update the platform
cd /opt/dolipaas
git pull
docker-compose down
docker-compose up -d
```

### 7.2 Backup Strategy

```bash
# Create a backup directory
mkdir -p /opt/backups

# Backup the database
docker exec -t dolipaas_db mysqldump -u root -p[root_password] --all-databases > /opt/backups/all-databases-$(date +%F).sql

# Backup application data
tar -czf /opt/backups/app-data-$(date +%F).tar.gz /opt/dolipaas/data
```

### 7.3 Monitoring

Consider setting up monitoring with Prometheus and Grafana:

```bash
# Clone monitoring configuration
git clone https://github.com/yourusername/dolipaas-monitoring.git /opt/monitoring

# Deploy monitoring stack
cd /opt/monitoring
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Docker containers not starting**
   - Check logs: `docker-compose logs`
   - Verify environment variables in .env file
   - Ensure ports are not already in use

2. **Database connection issues**
   - Verify database credentials in .env file
   - Check if database container is running
   - Inspect database logs: `docker-compose logs db`

3. **Nginx configuration problems**
   - Test configuration: `sudo nginx -t`
   - Check Nginx error logs: `sudo cat /var/log/nginx/error.log`
   - Verify firewall settings: `sudo ufw status`

## Conclusion

You have successfully deployed the DoliPaaS platform on a Contabo VM. The platform is now ready to deploy and manage Dolibarr instances. For additional support or to report issues, please refer to the project documentation or contact the support team.