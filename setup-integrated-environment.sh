#!/bin/bash

# DoliPaaS Integrated Environment Setup Script
# This script automates the setup of the DoliPaaS platform with frontend, backend, and Dolibarr integration

set -e

echo "=== DoliPaaS Integrated Environment Setup ==="
echo "This script will set up the complete DoliPaaS platform."
echo

# Create necessary directories
mkdir -p infrastructure/nginx/conf.d
mkdir -p infrastructure/nginx/ssl

# Check if .env file exists, if not create from example
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please edit the .env file with your specific configuration."
  else
    echo "ERROR: .env.example file not found. Please create a .env file manually."
    exit 1
  fi
fi

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
  echo "Docker is not installed. Please install Docker first."
  exit 1
fi

if ! command -v docker-compose &> /dev/null; then
  echo "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Create SSL directory for Nginx if it doesn't exist
if [ ! -d "infrastructure/nginx/ssl" ]; then
  mkdir -p infrastructure/nginx/ssl
fi

# Check if Nginx configuration exists
if [ ! -f "infrastructure/nginx/conf.d/default.conf" ]; then
  echo "Creating Nginx configuration..."
  cat > infrastructure/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Dolibarr
    location /dolibarr {
        proxy_pass http://dolibarr:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
fi

# Start the services
echo "Starting DoliPaaS services..."
docker-compose up -d

echo
echo "=== DoliPaaS Setup Complete ==="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:4000/api"
echo "Dolibarr: http://localhost:8080"
echo "Nginx Proxy: http://localhost"
echo
echo "For production use, please update the domain name in:"
echo "- .env file"
echo "- infrastructure/nginx/conf.d/default.conf"
echo
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"