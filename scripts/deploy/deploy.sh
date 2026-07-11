#!/usr/bin/env bash
# Workflow deploy/update aplikasi. Jalankan tiap kali ada perubahan kode:
# bash scripts/deploy/deploy.sh
set -euo pipefail

APP_DIR="/var/www/gee-cell-brebes-app"
cd "$APP_DIR"

echo "== Pull kode terbaru =="
git pull

echo "== Install dependencies =="
npm ci

echo "== Jalankan migrasi database =="
npx prisma migrate deploy

echo "== Build aplikasi =="
npm run build

echo "== Reload PM2 =="
if pm2 describe gee-cell-brebes-app > /dev/null 2>&1; then
  pm2 reload ecosystem.config.js
else
  pm2 start ecosystem.config.js
  pm2 save
fi

echo "Deploy selesai."
