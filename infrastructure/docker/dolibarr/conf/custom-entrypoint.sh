#!/bin/bash
set -e

# Function to wait for database to be ready
wait_for_db() {
    echo "Waiting for database to be ready..."
    for i in {1..30}; do
        if mysql -h "$DOLI_DB_HOST" -u "$DOLI_DB_USER" -p"$DOLI_DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
            echo "Database is ready!"
            return 0
        fi
        echo "Database connection attempt $i failed, retrying..."
        sleep 2
    done
    echo "Could not connect to database after 30 attempts!"
    return 1
}

# Wait for database to be ready
wait_for_db

# Create backup directory if it doesn't exist
mkdir -p /var/www/documents/backup
chown -R www-data:www-data /var/www/documents

# Run the original entrypoint script from the base image
/usr/local/bin/docker-run.sh &

# Wait for Dolibarr to initialize
sleep 10

# Execute custom command if provided
exec "$@"