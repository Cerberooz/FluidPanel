#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

APP_URL_VALUE="${APP_URL:-http://localhost}"
ADMIN_EMAIL="${PANEL_ADMIN_EMAIL:-}"
ADMIN_USERNAME="${PANEL_ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${PANEL_ADMIN_PASSWORD:-}"

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "$1 is required but was not found on PATH." >&2
        exit 1
    fi
}

set_env_value() {
    local name="$1"
    local value="$2"

    if grep -qE "^${name}=" .env; then
        sed -i.bak "s|^${name}=.*|${name}=${value}|" .env
        rm -f .env.bak
    else
        printf '\n%s=%s\n' "$name" "$value" >> .env
    fi
}

require_command php
require_command composer
require_command node

if ! command -v yarn >/dev/null 2>&1; then
    if command -v corepack >/dev/null 2>&1; then
        corepack enable
        corepack prepare yarn@1.22.22 --activate
    else
        echo "yarn is required but was not found. Install Yarn or enable Corepack." >&2
        exit 1
    fi
fi

if [ ! -f .env ]; then
    cp .env.example .env
fi

mkdir -p database
touch database/database.sqlite

# These directories are ignored by git but are required by Laravel and the
# frontend build on a fresh checkout.
mkdir -p \
    bootstrap/cache \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    public/assets

set_env_value APP_ENV production
set_env_value APP_DEBUG false
set_env_value APP_NAME Fluid
set_env_value APP_THEME fluid
set_env_value APP_URL "$APP_URL_VALUE"
set_env_value APP_FORCE_HTTPS false
set_env_value DB_CONNECTION sqlite
set_env_value DB_DATABASE database/database.sqlite
set_env_value DB_FOREIGN_KEYS true
set_env_value CACHE_DRIVER file
set_env_value QUEUE_CONNECTION sync
set_env_value SESSION_DRIVER file

composer install --no-dev --optimize-autoloader

if grep -qE '^APP_KEY=\s*$' .env; then
    php artisan key:generate --force
fi

yarn install --frozen-lockfile
yarn run build:production

php artisan migrate --seed --force
php artisan storage:link || true
php artisan optimize

if [ -n "$ADMIN_EMAIL" ] && [ -n "$ADMIN_PASSWORD" ]; then
    php artisan p:user:make \
        --email="$ADMIN_EMAIL" \
        --username="$ADMIN_USERNAME" \
        --name-first="Flux" \
        --name-last="Admin" \
        --password="$ADMIN_PASSWORD" \
        --admin=1
else
    echo
    echo "Admin user was not created because PANEL_ADMIN_EMAIL and PANEL_ADMIN_PASSWORD were not both set."
    echo "Create one manually with:"
    echo "php artisan p:user:make --email=you@example.com --username=admin --name-first=Flux --name-last=Admin --password='StrongPasswordHere' --admin=1"
fi

echo
echo "FluidPanel setup complete."
echo "For a quick test run:"
echo "php artisan serve --host=0.0.0.0 --port=8080"
