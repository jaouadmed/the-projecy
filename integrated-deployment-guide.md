# DoliPaaS Integrated Deployment Guide

This guide provides comprehensive instructions for deploying the complete DoliPaaS platform, including the frontend, backend, and Dolibarr integration on a Contabo Virtual Machine.

## Prerequisites

- Contabo VPS with Ubuntu Server 22.04 LTS (4+ vCPU, 8GB+ RAM, 100GB+ SSD)
- Docker and Docker Compose installed (follow the VM Deployment Guide sections 1 and 2)
- Domain name (optional but recommended)

## 1. Clone the DoliPaaS Repository

```bash
# Create project directory
sudo mkdir -p /opt/dolipaas
sudo chown $USER:$USER /opt/dolipaas
cd /opt/dolipaas

# Clone the repository (if using Git) or create the structure manually
git clone https://github.com/jaouadmed/the-projecy.git .
# OR
mkdir -p backend frontend database infrastructure/docker/dolibarr
```

## 2. Configure Environment Variables

Create a `.env` file in the root directory to store all environment variables:

```bash
cat > .env << 'EOF'
# General settings
NODE_ENV=production

# Backend settings
BACKEND_PORT=4000
JWT_SECRET=your_secure_jwt_secret_change_this_in_production
MONGODB_URI=mongodb://dolipaas:dolipaas_password@db:27017/dolipaas

# Database settings
DB_HOST=db
DB_PORT=3306
DB_USER=dolipaas
DB_PASSWORD=dolipaas_password
DB_NAME=dolipaas
DB_ROOT_PASSWORD=root_password_change_this

# Dolibarr settings
DOLI_DB_HOST=dolibarr_db
DOLI_DB_USER=dolibarr
DOLI_DB_PASSWORD=dolibarr_password
DOLI_DB_NAME=dolibarr
DOLI_URL_ROOT=185.208.207.231:8080
DOLI_ADMIN_LOGIN=admin
DOLI_ADMIN_PASSWORD=admin_password_change_this
DOLI_MODULES=modSociete,modService,modProduct,modProjet,modPropale,modFacture

# Frontend settings
FRONTEND_PORT=3000
VITE_API_URL=185.208.207.231:4000/api
EOF
```

## 3. Set Up the Backend

### 3.1 Create Backend Configuration

```bash
# Navigate to the backend directory
cd /opt/dolipaas/backend

# Create .env file for backend
cat > .env << 'EOF'
PORT=4000
MONGODB_URI=mongodb://dolipaas:dolipaas_password@db:27017/dolipaas
JWT_SECRET=your_secure_jwt_secret_change_this_in_production
NODE_ENV=production
DOCKER_SOCKET=/var/run/docker.sock
EOF

# Install dependencies (if not using Docker)
npm install
```

### 3.2 Configure Backend for Dolibarr Integration

Ensure the backend has the necessary routes and controllers to manage Dolibarr deployments. The existing `dolibarrConfig.js` routes and `DolibarrConfig.js` model should handle this.

## 4. Set Up the Frontend

### 4.1 Create Frontend Configuration

```bash
# Navigate to the frontend directory
cd /opt/dolipaas/frontend

# Create .env file for frontend
cat > .env << 'EOF'
VITE_API_URL=185.208.207.231:4000/api
EOF

# Install dependencies (if not using Docker)
npm install
```

### 4.2 Build the Frontend for Production

```bash
# Ensure compatible Node.js version (use Node.js 16 which is more compatible with older packages)
docker run --rm -v $(pwd):/app -w /app node:16 npm run build

# Alternatively, if running directly on the host:
# nvm install 16 && nvm use 16  # If using nvm
# npm run build
```

#### Troubleshooting Frontend Build Issues

If you encounter a syntax error like this when building the frontend:

```
SyntaxError: Unexpected token ;
    at Module._compile (internal/modules/cjs/loader.js:723:23)
```

This is typically caused by Node.js version incompatibility with some dependencies. Try these solutions:

1. **Use Node.js 16 for building:**
   ```bash
   # Using Docker to build with Node.js 16
   docker run --rm -v $(pwd):/app -w /app node:16 npm run build
   ```

2. **Install peer dependencies:**
   ```bash
   npm install --save-dev postcss-selector-parser@^6.0.10 @types/react@^18.0.0 typescript@^4.0.0
   npm run build
   ```

3. **Clean and reinstall node_modules:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

## 5. Create an Integrated Docker Compose File

Create a comprehensive Docker Compose file that includes all components:

```bash
cd /opt/dolipaas

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Frontend service - User dashboard
  frontend:
    image: node:16-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    command: sh -c "npm install --save-dev postcss-selector-parser@^6.0.10 @types/react@^18.0.0 typescript@^4.0.0 && npm run start"
    ports:
      - "${FRONTEND_PORT:-3000}:3000"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - VITE_API_URL=${VITE_API_URL:-http://localhost:4000/api}
    depends_on:
      - backend
    restart: always
    networks:
      - dolipaas_network

  # Backend service - API and orchestration
  backend:
    image: node:16-alpine
    working_dir: /app
    volumes:
      - ./backend:/app
      - /var/run/docker.sock:/var/run/docker.sock
    command: sh -c "npm install && npm run start"
    ports:
      - "${BACKEND_PORT:-4000}:4000"
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - DB_HOST=${DB_HOST:-db}
      - DB_PORT=${DB_PORT:-3306}
      - DB_USER=${DB_USER:-dolipaas}
      - DB_PASSWORD=${DB_PASSWORD:-dolipaas_password}
      - DB_NAME=${DB_NAME:-dolipaas}
      - JWT_SECRET=${JWT_SECRET:-your_jwt_secret_key_change_this_in_production}
      - DOCKER_SOCKET=/var/run/docker.sock
      - MONGODB_URI=${MONGODB_URI:-mongodb://dolipaas:dolipaas_password@db:27017/dolipaas}
    depends_on:
      - db
    restart: always
    networks:
      - dolipaas_network

  # Database service - Stores user data and deployment configurations
  db:
    image: mariadb:10.6
    volumes:
      - dolipaas_db_data:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-root_password_change_this}
      - MYSQL_DATABASE=${DB_NAME:-dolipaas}
      - MYSQL_USER=${DB_USER:-dolipaas}
      - MYSQL_PASSWORD=${DB_PASSWORD:-dolipaas_password}
    ports:
      - "3306:3306"
    restart: always
    networks:
      - dolipaas_network

  # Dolibarr service - Main application
  dolibarr:
    image: tuxgasy/dolibarr:latest
    restart: always
    environment:
      - DOLI_DB_HOST=${DOLI_DB_HOST:-dolibarr_db}
      - DOLI_DB_USER=${DOLI_DB_USER:-dolibarr}
      - DOLI_DB_PASSWORD=${DOLI_DB_PASSWORD:-dolibarr_password}
      - DOLI_DB_NAME=${DOLI_DB_NAME:-dolibarr}
      - DOLI_URL_ROOT=${DOLI_URL_ROOT:-http://localhost:8080}
      - DOLI_ADMIN_LOGIN=${DOLI_ADMIN_LOGIN:-admin}
      - DOLI_ADMIN_PASSWORD=${DOLI_ADMIN_PASSWORD:-admin_password_change_this}
      - DOLI_MODULES=${DOLI_MODULES:-modSociete,modService,modProduct,modProjet,modPropale,modFacture}
    ports:
      - "8080:80"
    volumes:
      - dolibarr_documents:/var/www/documents
    depends_on:
      - dolibarr_db
    networks:
      - dolipaas_network

  # Database for Dolibarr - Each application gets its own database
  dolibarr_db:
    image: mariadb:10.6
    restart: always
    environment:
      - MYSQL_ROOT_PASSWORD=${DB_ROOT_PASSWORD:-root_password_change_this}
      - MYSQL_DATABASE=${DOLI_DB_NAME:-dolibarr}
      - MYSQL_USER=${DOLI_DB_USER:-dolibarr}
      - MYSQL_PASSWORD=${DOLI_DB_PASSWORD:-dolibarr_password}
    volumes:
      - dolibarr_db_data:/var/lib/mysql
    networks:
      - dolipaas_network

  # Nginx reverse proxy for routing traffic
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/conf.d:/etc/nginx/conf.d
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
      - dolibarr
    restart: always
    networks:
      - dolipaas_network

volumes:
  dolipaas_db_data:
  dolibarr_documents:
  dolibarr_db_data:

networks:
  dolipaas_network:
    driver: bridge
EOF
```

## 6. Configure Nginx as a Reverse Proxy

Create an Nginx configuration to route traffic to the appropriate services:

```bash
# Create directory for Nginx configuration
mkdir -p /opt/dolipaas/infrastructure/nginx/conf.d

# Create Nginx configuration file
cat > /opt/dolipaas/infrastructure/nginx/conf.d/default.conf << 'EOF'
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
```

## 7. Deploy the Integrated Platform

```bash
# Navigate to the project directory
cd /opt/dolipaas

# Start all services
docker-compose up -d

# Check if all containers are running
docker-compose ps
```

## 8. Access the Platform

After deployment, you can access the different components:

- Frontend Dashboard: http://your-domain.com/ or http://your-server-ip/
- Backend API: http://your-domain.com/api or http://your-server-ip/api
- Dolibarr: http://your-domain.com/dolibarr or http://your-server-ip/dolibarr

## 9. Integration Testing

Verify that all components are working together correctly:

1. Register a new user account through the frontend
2. Log in with the created account
3. Create a new Dolibarr deployment through the dashboard
4. Verify that the deployment is created successfully
5. Access the deployed Dolibarr instance

## 10. Troubleshooting

### 10.1 Check Container Logs

```bash
# View logs for a specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs dolibarr

# Follow logs in real-time
docker-compose logs -f
```

### 10.2 Common Issues and Solutions

#### Frontend Cannot Connect to Backend

- Check that the `VITE_API_URL` environment variable is set correctly
- Verify that the backend container is running
- Check Nginx configuration for proper routing

#### Frontend Build Errors

- **SyntaxError with eslint-webpack-plugin**: If you see `SyntaxError: Unexpected token ;` related to eslint-webpack-plugin, this is typically caused by Node.js version incompatibility:
  ```
  /opt/dolipaas/frontend/node_modules/eslint-webpack-plugin/node_modules/jest-worker/build/index.js:110
    _ending;
           ^
  SyntaxError: Unexpected token ;
  ```
  - Solution: Use Node.js 16 as specified in the Docker Compose file and build instructions
  - If building outside Docker, install Node.js 16 using nvm: `nvm install 16 && nvm use 16`

- **Peer dependency warnings**: Install missing peer dependencies as specified in section 4.2

- **For persistent build issues**: Try building in a clean environment using Docker:
  ```bash
  docker run --rm -v $(pwd):/app -w /app node:16 sh -c "npm ci && npm run build"
  ```

#### Backend Cannot Connect to Database

- Verify database credentials in the `.env` file
- Check if the database container is running
- Try to connect to the database manually to verify access

#### Dolibarr Configuration Issues

- Check Dolibarr container logs for errors
- Verify that the database connection parameters are correct
- Ensure volumes are properly mounted for persistent data

## 11. Backup and Maintenance

### 11.1 Backup Data

```bash
# Create a backup directory
mkdir -p /opt/dolipaas/backups

# Backup database data
docker-compose exec db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --all-databases' > /opt/dolipaas/backups/all-databases-$(date +%Y%m%d).sql

# Backup Dolibarr documents
docker run --rm -v dolibarr_documents:/source -v /opt/dolipaas/backups:/backup alpine tar -czf /backup/dolibarr-documents-$(date +%Y%m%d).tar.gz -C /source .
```

### 11.2 Update Components

```bash
# Pull latest images
docker-compose pull

# Restart services with new images
docker-compose up -d
```

## 12. Security Considerations

- Change all default passwords in the `.env` file
- Set up a firewall to restrict access to necessary ports only
- Configure SSL/TLS for secure communication
- Regularly update all components
- Implement proper authentication and authorization

## Conclusion

You have successfully deployed the integrated DoliPaaS platform with frontend, backend, and Dolibarr components. This setup provides a complete environment for managing Dolibarr deployments through a user-friendly dashboard.

For more detailed information about each component, refer to their respective documentation.