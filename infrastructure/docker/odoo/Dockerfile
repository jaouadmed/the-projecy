FROM odoo:latest

# Install additional dependencies and utilities
RUN apt-get update && apt-get install -y \
    python3-pip \
    supervisor \
    cron \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install additional Python packages
RUN pip3 install --no-cache-dir \
    num2words \
    phonenumbers \
    pyldap \
    python-slugify

# Copy configuration files
COPY ./conf/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY ./conf/cron-tasks /etc/cron.d/odoo-cron
COPY ./conf/custom-entrypoint.sh /usr/local/bin/custom-entrypoint.sh
COPY ./conf/odoo.conf /etc/odoo/odoo.conf

# Make the custom entrypoint script executable
RUN chmod +x /usr/local/bin/custom-entrypoint.sh

# Set proper permissions for cron job
RUN chmod 0644 /etc/cron.d/odoo-cron

# Create required directories with proper permissions
RUN mkdir -p /var/lib/odoo/backups \
    && chown -R odoo:odoo /var/lib/odoo

# Expose volume for persistent data
VOLUME ["/var/lib/odoo", "/mnt/extra-addons"]

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/custom-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]