FROM wordpress:latest

# Install additional PHP extensions and utilities
RUN apt-get update && apt-get install -y \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libzip-dev \
    supervisor \
    cron \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) gd mysqli zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Configure PHP for better performance
RUN { \
    echo 'upload_max_filesize = 64M'; \
    echo 'post_max_size = 64M'; \
    echo 'memory_limit = 256M'; \
    echo 'max_execution_time = 300'; \
    echo 'max_input_time = 300'; \
} > /usr/local/etc/php/conf.d/wordpress-performance.ini

# Copy configuration files
COPY ./conf/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./conf/cron-tasks /etc/cron.d/wordpress-cron
COPY ./conf/custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

# Make the custom entrypoint script executable
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Set proper permissions for cron job
RUN chmod 0644 /etc/cron.d/wordpress-cron

# Create required directories with proper permissions
RUN mkdir -p /var/www/html/wp-content/uploads/backups \
    && chown -R www-data:www-data /var/www/html

# Expose volume for persistent data
VOLUME ["/var/www/html"]

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]