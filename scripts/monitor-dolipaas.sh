#!/bin/bash

# DoliPaaS Monitoring Script
# This script provides monitoring capabilities for the DoliPaaS platform

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

print_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  print_error "Docker is not installed. Please install Docker first."
  exit 1
}

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  print_error "Docker Compose is not installed. Please install Docker Compose first."
  exit 1
}

# Default directory
DOLIPAAS_DIR="/opt/dolipaas"
DOCKER_COMPOSE_DIR="${DOLIPAAS_DIR}/infrastructure/docker/odoo"

# Check if the directory exists
if [ ! -d "${DOCKER_COMPOSE_DIR}" ]; then
  print_error "DoliPaaS directory not found at ${DOCKER_COMPOSE_DIR}"
  read -p "Enter the path to your DoliPaaS docker-compose directory: " DOCKER_COMPOSE_DIR
  if [ ! -d "${DOCKER_COMPOSE_DIR}" ]; then
    print_error "Directory not found. Exiting."
    exit 1
  fi
 fi

# Function to check container status
check_container_status() {
  print_header "Container Status"
  cd "${DOCKER_COMPOSE_DIR}"
  docker-compose ps
}

# Function to check container logs
check_container_logs() {
  local container=$1
  local lines=$2
  
  print_header "Container Logs for ${container} (last ${lines} lines)"
  cd "${DOCKER_COMPOSE_DIR}"
  docker-compose logs --tail="${lines}" "${container}"
}

# Function to check resource usage
check_resource_usage() {
  print_header "Resource Usage"
  cd "${DOCKER_COMPOSE_DIR}"
  docker stats --no-stream $(docker-compose ps -q)
}

# Function to check disk usage
check_disk_usage() {
  print_header "Disk Usage"
  df -h | grep -E 'Filesystem|/$'
  
  print_header "Docker Volume Usage"
  docker system df -v | grep -E 'VOLUME NAME|dolipaas'
}

# Function to check database status
check_database_status() {
  print_header "Database Status"
  cd "${DOCKER_COMPOSE_DIR}"
  
  # Get database container ID
  DB_CONTAINER=$(docker-compose ps -q db)
  
  if [ -z "${DB_CONTAINER}" ]; then
    print_error "Database container not found"
    return 1
  fi
  
  # Get database credentials from environment file
  if [ -f ".env" ]; then
    source .env
    DB_USER=${DB_USER:-odoo}
    DB_PASSWORD=${DB_PASSWORD:-odoo_password}
    DB_NAME=${DB_NAME:-odoo}
  else
    print_warning ".env file not found, using default credentials"
    DB_USER="odoo"
    DB_PASSWORD="odoo_password"
    DB_NAME="odoo"
  fi
  
  print_info "Database size:"
  docker exec -it "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT pg_size_pretty(pg_database_size('${DB_NAME}')) AS db_size;"
  
  print_info "Database connections:"
  docker exec -it "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT count(*) AS connections FROM pg_stat_activity;"
}

# Function to check network status
check_network_status() {
  print_header "Network Status"
  cd "${DOCKER_COMPOSE_DIR}"
  
  # Get network name from docker-compose
  NETWORK_NAME=$(docker-compose config --services | grep -q "odoo" && docker network ls --filter name=odoo_network --format "{{.Name}}")
  
  if [ -z "${NETWORK_NAME}" ]; then
    print_warning "Network not found, using default network name"
    NETWORK_NAME="odoo_network"
  fi
  
  print_info "Network information:"
  docker network inspect "${NETWORK_NAME}" | grep -E 'Name|Gateway|Container'
}

# Function to check application health
check_application_health() {
  print_header "Application Health"
  cd "${DOCKER_COMPOSE_DIR}"
  
  # Get application container ID
  APP_CONTAINER=$(docker-compose ps -q odoo)
  
  if [ -z "${APP_CONTAINER}" ]; then
    print_error "Application container not found"
    return 1
  fi
  
  # Get application port from docker-compose
  APP_PORT=$(docker port "${APP_CONTAINER}" 8069 | cut -d ':' -f 2)
  
  if [ -z "${APP_PORT}" ]; then
    print_warning "Application port not found, using default port 8069"
    APP_PORT="8069"
  fi
  
  print_info "Checking application health at http://localhost:${APP_PORT}"
  curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}" | grep -q "200" && \
    print_info "Application is responding with HTTP 200 OK" || \
    print_error "Application is not responding properly"
}

# Function to perform a quick backup
perform_quick_backup() {
  print_header "Quick Backup"
  
  # Check if backup script exists
  if [ -f "${DOLIPAAS_DIR}/backup.sh" ]; then
    print_info "Running backup script..."
    "${DOLIPAAS_DIR}/backup.sh"
  else
    print_error "Backup script not found at ${DOLIPAAS_DIR}/backup.sh"
    return 1
  fi
}

# Main menu
show_menu() {
  clear
  echo -e "${BLUE}=========================================${NC}"
  echo -e "${BLUE}      DoliPaaS Monitoring Script        ${NC}"
  echo -e "${BLUE}=========================================${NC}"
  echo -e "\n1. Check container status"
  echo "2. Check container logs"
  echo "3. Check resource usage"
  echo "4. Check disk usage"
  echo "5. Check database status"
  echo "6. Check network status"
  echo "7. Check application health"
  echo "8. Perform quick backup"
  echo "9. Run all checks"
  echo "0. Exit"
  echo -e "\nCurrent DoliPaaS directory: ${DOCKER_COMPOSE_DIR}"
  echo -e "${BLUE}=========================================${NC}"
}

# Main loop
while true; do
  show_menu
  read -p "Enter your choice [0-9]: " choice
  
  case $choice in
    1) check_container_status ;;
    2) read -p "Enter container name [odoo/db]: " container_name
       read -p "Enter number of lines to show [50]: " lines
       container_name=${container_name:-odoo}
       lines=${lines:-50}
       check_container_logs "${container_name}" "${lines}" ;;
    3) check_resource_usage ;;
    4) check_disk_usage ;;
    5) check_database_status ;;
    6) check_network_status ;;
    7) check_application_health ;;
    8) perform_quick_backup ;;
    9) check_container_status
       check_container_logs "odoo" 20
       check_container_logs "db" 20
       check_resource_usage
       check_disk_usage
       check_database_status
       check_network_status
       check_application_health ;;
    0) echo "Exiting..."
       exit 0 ;;
    *) print_error "Invalid option. Please try again." ;;
  esac
  
  echo
  read -p "Press Enter to continue..."
done