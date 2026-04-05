#!/bin/bash
# Local deploy script: pull → build → copy to /var/www/dimino.me
set -e

cd "$(dirname "$0")"

echo "[deploy] Pulling latest..."
git pull origin main

echo "[deploy] Installing deps..."
npm ci

echo "[deploy] Building..."
npm run build

echo "[deploy] Copying to /var/www/dimino.me..."
rsync -av --delete dist/ /var/www/dimino.me/

echo "[deploy] Done!"
