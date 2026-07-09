#!/usr/bin/env bash
# Buat database & user Postgres untuk gee-cell-brebes-app.
# Jalankan SEKALI saja di VPS (Node.js, PostgreSQL, Nginx, Certbot, PM2 diasumsikan
# sudah terinstall lewat setup-vps.sh milik aplikasi Ekek sebelumnya).
set -euo pipefail

read -rp "Password untuk user database brebes_app: " DB_PASS
sudo -u postgres psql -c "CREATE USER brebes_app WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -c "CREATE DATABASE gee_cell_brebes OWNER brebes_app;"

echo ""
echo "Database siap. Langkah selanjutnya:"
echo "1. Clone/upload kode aplikasi ke /var/www/gee-cell-brebes-app"
echo "2. Buat file .env.production (contoh: .env.production.example)"
echo "3. Jalankan scripts/deploy/deploy.sh"
echo "4. Setup Nginx (lihat deploy/nginx.conf.example) lalu jalankan certbot untuk SSL"
