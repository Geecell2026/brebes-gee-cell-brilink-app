#!/usr/bin/env bash
# Backup harian database. Daftarkan lewat cron, misalnya jam 2 pagi:
#   crontab -e
#   0 2 * * * /var/www/gee-cell-brebes-app/scripts/deploy/backup-db.sh
set -euo pipefail

BACKUP_DIR="/var/backups/gee-cell-brebes"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="$BACKUP_DIR/gee_cell_brebes_${TIMESTAMP}.sql.gz"

PGPASSWORD="$DB_BACKUP_PASSWORD" pg_dump -U brebes_app -h localhost gee_cell_brebes | gzip > "$FILE"

# Simpan backup 14 hari terakhir saja, hapus yang lebih lama.
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +14 -delete

echo "Backup selesai: $FILE"
