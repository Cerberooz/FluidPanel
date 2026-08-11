param(
    [string]$AppUrl = $(if ($env:APP_URL) { $env:APP_URL } else { "https://panel.fluxservers.cloud" }),
    [string]$AdminEmail = $env:PANEL_ADMIN_EMAIL,
    [string]$AdminUsername = $(if ($env:PANEL_ADMIN_USERNAME) { $env:PANEL_ADMIN_USERNAME } else { "admin" }),
    [string]$AdminPassword = $env:PANEL_ADMIN_PASSWORD
)

$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

function Require-Command($Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required but was not found on PATH."
    }
}

function Set-EnvValue($Name, $Value) {
    $path = ".env"
    $escaped = [Regex]::Escape($Name)
    $line = "$Name=$Value"
    $content = Get-Content -Raw -LiteralPath $path

    if ($content -match "(?m)^$escaped=") {
        $content = [Regex]::Replace($content, "(?m)^$escaped=.*$", [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $line })
    } else {
        $content = $content.TrimEnd() + [Environment]::NewLine + $line + [Environment]::NewLine
    }

    Set-Content -LiteralPath $path -Value $content -NoNewline
}

Require-Command "php"
Require-Command "composer"
Require-Command "node"

if (-not (Get-Command "yarn" -ErrorAction SilentlyContinue)) {
    if (Get-Command "corepack" -ErrorAction SilentlyContinue) {
        corepack enable
        corepack prepare yarn@1.22.22 --activate
    } else {
        throw "yarn is required but was not found. Install Yarn or enable Corepack."
    }
}

if (-not (Test-Path -LiteralPath ".env")) {
    Copy-Item -LiteralPath ".env.example" -Destination ".env"
}

if (-not (Test-Path -LiteralPath "database")) {
    New-Item -ItemType Directory -Path "database" | Out-Null
}

if (-not (Test-Path -LiteralPath "database/database.sqlite")) {
    New-Item -ItemType File -Path "database/database.sqlite" | Out-Null
}

# These directories are ignored by git but are required by Laravel and the
# frontend build on a fresh checkout.
@(
    "bootstrap/cache",
    "storage/framework/cache/data",
    "storage/framework/sessions",
    "storage/framework/views",
    "public/assets"
) | ForEach-Object {
    if (-not (Test-Path -LiteralPath $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Set-EnvValue "APP_ENV" "production"
Set-EnvValue "APP_DEBUG" "false"
Set-EnvValue "APP_THEME" "fluid"
Set-EnvValue "APP_URL" $AppUrl
Set-EnvValue "DB_CONNECTION" "sqlite"
Set-EnvValue "DB_DATABASE" "database/database.sqlite"
Set-EnvValue "DB_FOREIGN_KEYS" "true"
Set-EnvValue "CACHE_DRIVER" "file"
Set-EnvValue "QUEUE_CONNECTION" "sync"
Set-EnvValue "SESSION_DRIVER" "file"

composer install --no-dev --optimize-autoloader

$envText = Get-Content -Raw -LiteralPath ".env"
if ($envText -match "(?m)^APP_KEY=\s*$") {
    php artisan key:generate --force
}

yarn install --frozen-lockfile
yarn run build:production

php artisan migrate --seed --force
php artisan storage:link
php artisan optimize

if ($AdminEmail -and $AdminPassword) {
    php artisan p:user:make --email="$AdminEmail" --username="$AdminUsername" --name-first="Flux" --name-last="Admin" --password="$AdminPassword" --admin=1
} else {
    Write-Host ""
    Write-Host "Admin user was not created because PANEL_ADMIN_EMAIL and PANEL_ADMIN_PASSWORD were not both set."
    Write-Host "Create one manually with:"
    Write-Host "php artisan p:user:make --email=you@example.com --username=admin --name-first=Flux --name-last=Admin --password='StrongPasswordHere' --admin=1"
}

Write-Host ""
Write-Host "FluidPanel setup complete."
Write-Host "For a quick test run:"
Write-Host "php artisan serve --host=0.0.0.0 --port=8080"
