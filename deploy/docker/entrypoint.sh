#!/bin/sh
set -eu

# Storage is a persistent Docker volume. Fixing ownership prevents Laravel log
# and upload permission failures after a container update.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

exec "$@"
