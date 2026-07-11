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

# Salin juga ke Google Drive (remote terpisah dari penyimpanan VPS ini) -
# kalau rclone belum terpasang/terkonfigurasi, backup lokal tetap jalan,
# cuma langkah upload ini yang dilewati (tidak boleh bikin backup lokal gagal).
DRIVE_REMOTE="gee-cell-drive"
DRIVE_FOLDER_ID="1eioYE49fR52dFaD5lZzpJ6TubiPXhG5M"
if command -v rclone >/dev/null 2>&1 && rclone listremotes | grep -q "^${DRIVE_REMOTE}:"; then
  if rclone copy "$FILE" "${DRIVE_REMOTE}:" --drive-root-folder-id="$DRIVE_FOLDER_ID"; then
    echo "Backup tersalin ke Google Drive: $(basename "$FILE")"
  else
    echo "PERINGATAN: gagal menyalin backup ke Google Drive (backup lokal tetap tersimpan)" >&2
  fi
else
  echo "PERINGATAN: rclone remote '${DRIVE_REMOTE}' belum terkonfigurasi, backup ke Drive dilewati" >&2
fi
