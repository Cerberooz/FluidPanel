# Flux panel and status: Docker deployment

This repository contains both applications:

- `panel` is the Laravel FluidPanel application.
- `Flux Status/Flux Status` is the Flask status application.

The panel uses SQLite (`database/database.sqlite`), file sessions and a
synchronous queue. The Compose setup bind-mounts `database`, `storage`, and
`bootstrap/cache`, so it continues using the existing panel accounts, servers,
API keys and settings. Do **not** run `setup-fluid.sh`, create another database,
or delete those folders during this migration.

## One-time setup

1. On the VPS, open the panel repository directory:

   ```bash
   cd /home/fluxseverseu/panel
   ```

2. Create the private status environment file:

   ```bash
   cp "Flux Status/Flux Status/.env.example" "Flux Status/Flux Status/.env"
   nano "Flux Status/Flux Status/.env"
   ```

   Set `PANEL_API_KEY` to a newly created Fluid **Application API** key with
   read access to nodes. It is only used inside the status container.

3. Update the host Nginx configuration. Keep its existing TLS certificates,
   but replace the panel `root` / PHP locations with a proxy to
   `http://127.0.0.1:8080`. Add a second host for
   `status.fluxservers.cloud` that proxies to `http://127.0.0.1:8081`.

   Both DNS names must point to the same VPS IP. The existing `panel` record
   stays unchanged; add a `status` A record for that same IP.

## Start or update both applications

```bash
cd /home/fluxseverseu/panel
docker compose up -d --build
```

After pulling a panel version that includes database migrations, run this once
before using the updated panel:

```bash
docker compose exec panel php artisan migrate --force
docker compose exec panel php artisan optimize
```

Useful checks:

```bash
docker compose ps
docker compose logs -f panel status
```

Stop both without deleting their data:

```bash
docker compose down
```
