# FluxPanel production architecture

`docker compose up -d` starts the complete application stack:

- **panel** — the FluidPanel web application, reachable only through host Nginx.
- **worker** — Redis queue worker for background jobs.
- **scheduler** — Laravel scheduled tasks.
- **database** — MariaDB, persisted in the `fluidpanel_mariadb_data` Docker volume.
- **redis** — sessions, cache, and queued jobs, persisted in `fluidpanel_redis_data`.
- **status** — Flux Status, reachable only through host Nginx.

Wings remains a host service and continues using port `8080`. Host Nginx and
Certbot remain responsible for public HTTPS; they are not containers.

## First cutover: preserve the existing SQLite panel records

This is a one-time migration. It copies the existing SQLite rows — including
users, nodes, servers, allocations, nests, eggs, settings, and API keys — into
a **fresh** MariaDB database while preserving record IDs. It does not touch
Wings or game-server files.

Do this during a short maintenance window. Do not use `docker compose down -v`:
that `-v` flag deletes the new persistent database volume.

```bash
cd /home/fluxseverseu/panel

# Stop the old SQLite-backed containers so its database snapshot is consistent.
sudo docker compose down

# Keep a rollback copy outside the repository.
sudo install -d -m 700 /root/fluidpanel-backup
sudo cp -a database/database.sqlite storage /root/fluidpanel-backup/
sudo cp .env /root/fluidpanel-backup/panel.env
```

Edit the production `.env` (it is private and never committed):

```bash
nano .env
```

Replace the old SQLite/file values with the following. Generate two different
long random passwords; retain the existing `APP_KEY`, `APP_URL`, mail settings,
and all other existing settings.

```dotenv
DB_CONNECTION=mariadb
DB_HOST=database
DB_PORT=3306
DB_DATABASE=panel
DB_USERNAME=panel
DB_PASSWORD=your_long_random_database_password
MYSQL_ROOT_PASSWORD=a_different_long_random_root_password

CACHE_STORE=redis
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=redis
REDIS_PORT=6379
```

Create the status secret if it does not exist:

```bash
cp "Flux Status/Flux Status/.env.example" "Flux Status/Flux Status/.env"
nano "Flux Status/Flux Status/.env"
```

Set `PANEL_API_KEY` to a new read-only Fluid **Application API** key.

Start only MariaDB and Redis, create the MariaDB schema, then copy the legacy
SQLite records. The SQLite directory is mounted read-only for this command.

```bash
sudo docker compose up -d --build database redis
sudo docker compose run --rm -v "$PWD/database:/legacy:ro" panel php artisan migrate --force
sudo docker compose run --rm -v "$PWD/database:/legacy:ro" panel php artisan panel:migrate-legacy-sqlite --path=/legacy/database.sqlite --force
```

Copy persistent panel storage (logs/uploads) into its Docker volume, start the
whole stack, and rebuild Laravel's generated cache:

```bash
sudo docker run --rm \
  -v fluidpanel_storage:/to \
  -v "$PWD/storage:/from:ro" \
  alpine sh -c 'cp -a /from/. /to/'

sudo docker compose up -d
sudo docker compose exec panel php artisan optimize:clear
sudo docker compose exec panel php artisan optimize
sudo docker compose ps
```

Verify before removing anything:

```bash
curl -I http://127.0.0.1:18080
sudo docker compose logs --tail=100 panel worker scheduler
```

Keep `/root/fluidpanel-backup` and the old `database/database.sqlite` until you
have logged in, checked registered nodes, and confirmed existing servers in the
panel. The old SQLite file is no longer used after this cutover.

## Normal updates

```bash
cd /home/fluxseverseu/panel
git pull
sudo docker compose up -d --build
sudo docker compose exec panel php artisan migrate --force
sudo docker compose exec panel php artisan optimize
```

## MariaDB backup

Run this regularly and copy the resulting file off the VPS:

```bash
sudo docker compose exec -T database sh -c 'mariadb-dump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE"' \
  | sudo tee "/root/fluidpanel-backup/panel-$(date +%F).sql" > /dev/null
```

## Domains

Both A records point to the same VPS IP. Nginx routes them internally:

- `panel.fluxservers.cloud` → `127.0.0.1:18080`
- `status.fluxservers.cloud` → `127.0.0.1:18081`

Keep Nginx and Wings running. Request the status HTTPS certificate only after
the `status` DNS record resolves to the VPS.
