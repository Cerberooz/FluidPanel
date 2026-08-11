#!/bin/sh
set -eu

# These folders are bind-mounted from the existing panel installation. Fixing
# their ownership here prevents Laravel cache/session permission failures after
# a container update.
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache /var/www/html/database

exec "$@"
