# Panduan Deploy ke VPS Hostinger

Aplikasi ini pakai Next.js + PostgreSQL, di-deploy dengan PM2 (process manager) + Nginx (reverse proxy) + Certbot (SSL gratis). VPS yang dipakai sama dengan aplikasi Wilayah Ekek (gee-cell-brilink-app) dan n8n — Node.js, PostgreSQL, Nginx, Certbot, dan PM2 sudah terinstall dari setup Ekek sebelumnya, jadi di sini cukup buat database baru dan aplikasi baru di port berbeda (3001, karena Ekek pakai 3000 dan n8n pakai 5678).

## Persiapan

- Kode aplikasi ini sudah di-push ke repository Git (GitHub)
- Domain/subdomain (misal `brebes.geecell.my.id`) sudah diarahkan (DNS A record) ke IP VPS yang sama dengan Ekek

## Langkah 1: Buat database Postgres (sekali saja)

```bash
ssh root@ip-vps-anda
git clone <url-repo-anda> /var/www/gee-cell-brebes-app
cd /var/www/gee-cell-brebes-app
bash scripts/deploy/setup-db.sh
```

## Langkah 2: Konfigurasi environment

```bash
cd /var/www/gee-cell-brebes-app
cp .env.production.example .env.production
nano .env.production
```

Isi `DATABASE_URL` dengan password yang dibuat di Langkah 1, dan `AUTH_SECRET` dengan string acak panjang (generate dengan `openssl rand -base64 32`) — **jangan pakai nilai yang sama dengan Ekek**.

Rename jadi `.env` supaya terbaca aplikasi:
```bash
cp .env.production .env
```

## Langkah 3: Deploy aplikasi

```bash
bash scripts/deploy/deploy.sh
```

Skrip ini: `npm ci` → `prisma migrate deploy` → `npm run build` → jalankan lewat PM2 di port 3001.

Jalankan seed data awal (1 cabang Kersana + kategori biaya OPS/PROMOSI + akun admin) **sekali saja**:
```bash
SEED_ADMIN_EMAIL="email-anda" SEED_ADMIN_PASSWORD="password-aman" npx prisma db seed
```

## Langkah 4: Setup Nginx + SSL

```bash
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/gee-cell-brebes-app
sudo nano /etc/nginx/sites-available/gee-cell-brebes-app   # ganti domain-anda.com
sudo ln -s /etc/nginx/sites-available/gee-cell-brebes-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d domain-anda.com
```

Certbot otomatis setup HTTPS dan perpanjangan sertifikat otomatis.

## Langkah 5: Auto-start setelah reboot VPS

Sudah tercakup oleh `pm2 save` yang dijalankan `deploy.sh` — cukup pastikan `pm2 startup` sudah pernah dijalankan sebelumnya (sudah dilakukan saat setup Ekek).

## Langkah 6: Backup otomatis

```bash
sudo crontab -e
```

Tambahkan baris (backup tiap jam 2 pagi, geser 5 menit dari jadwal backup Ekek supaya tidak bentrok):
```
5 2 * * * DB_BACKUP_PASSWORD='password-database-anda' /var/www/gee-cell-brebes-app/scripts/deploy/backup-db.sh
```

## Update aplikasi di kemudian hari

```bash
cd /var/www/gee-cell-brebes-app
bash scripts/deploy/deploy.sh
```

## Cek status & debug

```bash
pm2 status                       # status semua aplikasi (Ekek, Brebes, n8n)
pm2 logs gee-cell-brebes-app     # lihat log aplikasi Brebes
sudo systemctl status nginx      # status nginx
sudo systemctl status postgresql # status database
```
