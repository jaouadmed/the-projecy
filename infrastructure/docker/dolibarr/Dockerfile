FROM tuxgasy/dolibarr:latest

# Add custom configuration and optimizations
RUN apt-get update && apt-get install -y \
    cron \
    supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy configuration files
COPY ./conf/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./conf/cron-tasks /etc/cron.d/dolibarr-cron
COPY ./conf/custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh

# Make the custom entrypoint script executable
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Set proper permissions for cron job
RUN chmod 0644 /etc/cron.d/dolibarr-cron

# Create required directories with proper permissions
RUN mkdir -p /var/www/documents/backup \
    && chown -R www-data:www-data /var/www/documents

# Expose volume for persistent data
VOLUME ["/var/www/documents"]

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]