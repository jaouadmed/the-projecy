#!/bin/bash
set -e

# Function to wait for database to be ready
wait_for_db() {
    echo "Waiting for database to be ready..."
    for i in {1..30}; do
        if mysql -h "$WORDPRESS_DB_HOST" -u "$WORDPRESS_DB_USER" -p"$WORDPRESS_DB_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
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
mkdir -p /var/www/html/wp-content/uploads/backups
chown -R www-data:www-data /var/www/html

# Install WP-CLI if not already installed
if [ ! -f /usr/local/bin/wp-cli.phar ]; then
    curl -o /usr/local/bin/wp-cli.phar https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    chmod +x /usr/local/bin/wp-cli.phar
    ln -sf /usr/local/bin/wp-cli.phar /usr/local/bin/wp
    echo "WP-CLI installed successfully"
fi

# Run the original entrypoint script from the base image
/usr/local/bin/docker-entrypoint.sh apache2-foreground &

# Wait for WordPress to initialize
sleep 10

# Execute custom command if provided
exec "$@"