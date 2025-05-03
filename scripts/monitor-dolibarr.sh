#!/bin/bash

# DoliPaaS Minimal Testing Environment Monitoring Script
# This script provides basic monitoring for Dolibarr deployments

CONTAINER_APP="dolibarr-app"
CONTAINER_DB="dolibarr-db"
LOG_FILE="/opt/dolipaas/monitoring.log"

# Create log header
echo "===== DoliPaaS Monitoring: $(date) =====" | tee -a "$LOG_FILE"

# Check if containers are running
echo "\n[1/4] Checking container status..." | tee -a "$LOG_FILE"
docker ps -a | grep -E "$CONTAINER_APP|$CONTAINER_DB" | tee -a "$LOG_FILE"

# Get container health status
echo "\n[2/4] Container health status:" | tee -a "$LOG_FILE"
APP_RUNNING=$(docker inspect --format='{{.State.Running}}' "$CONTAINER_APP" 2>/dev/null)
DB_RUNNING=$(docker inspect --format='{{.State.Running}}' "$CONTAINER_DB" 2>/dev/null)

if [ "$APP_RUNNING" == "true" ]; then
    echo "✅ $CONTAINER_APP is running" | tee -a "$LOG_FILE"
else
    echo "❌ $CONTAINER_APP is not running" | tee -a "$LOG_FILE"
    # Get last 10 lines of logs for troubleshooting
    echo "\n$CONTAINER_APP logs:" | tee -a "$LOG_FILE"
    docker logs --tail 10 "$CONTAINER_APP" 2>/dev/null | tee -a "$LOG_FILE"
fi

if [ "$DB_RUNNING" == "true" ]; then
    echo "✅ $CONTAINER_DB is running" | tee -a "$LOG_FILE"
else
    echo "❌ $CONTAINER_DB is not running" | tee -a "$LOG_FILE"
    # Get last 10 lines of logs for troubleshooting
    echo "\n$CONTAINER_DB logs:" | tee -a "$LOG_FILE"
    docker logs --tail 10 "$CONTAINER_DB" 2>/dev/null | tee -a "$LOG_FILE"
fi

# Check resource usage
echo "\n[3/4] Resource usage:" | tee -a "$LOG_FILE"
echo "Memory and CPU usage:" | tee -a "$LOG_FILE"
docker stats --no-stream "$CONTAINER_APP" "$CONTAINER_DB" | tee -a "$LOG_FILE"

# Check disk space
echo "\n[4/4] Disk space usage:" | tee -a "$LOG_FILE"
df -h /opt/dolipaas | tee -a "$LOG_FILE"

# Check if Dolibarr is accessible via HTTP
echo "\n[5/5] Web accessibility check:" | tee -a "$LOG_FILE"
SERVER_IP=$(hostname -I | awk '{print $1}')
DOLIBARR_PORT=$(grep DOLIBARR_PORT /opt/dolipaas/.env | cut -d= -f2 || echo "8080")

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://${SERVER_IP}:${DOLIBARR_PORT}/ 2>/dev/null)

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
    echo "✅ Dolibarr is accessible at http://${SERVER_IP}:${DOLIBARR_PORT}/" | tee -a "$LOG_FILE"
else
    echo "❌ Dolibarr is not accessible (HTTP Status: $HTTP_STATUS)" | tee -a "$LOG_FILE"
fi

echo "\n===== Monitoring Complete =====" | tee -a "$LOG_FILE"
echo "Full logs available at: $LOG_FILE"