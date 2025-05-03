#!/bin/bash
set -e

# Function to log messages
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log "Starting Odoo custom entrypoint"

# Create necessary directories if they don't exist
if [ ! -d "/var/lib/odoo/backups" ]; then
    log "Creating backups directory"
    mkdir -p /var/lib/odoo/backups
    chown -R odoo:odoo /var/lib/odoo/backups
fi

# Set proper permissions
log "Setting proper permissions for Odoo directories"
chown -R odoo:odoo /var/lib/odoo
chown -R odoo:odoo /mnt/extra-addons

# Initialize database if needed
if [ -z "$(ls -A /var/lib/odoo)" ]; then
    log "Initializing fresh Odoo installation"
    # Additional initialization steps can be added here
fi

# Start supervisord
log "Starting supervisord"
exec "$@"