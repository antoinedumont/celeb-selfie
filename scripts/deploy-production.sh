#!/bin/bash
# Production Deployment Script for Celeb Selfie
# Usage: ./scripts/deploy-production.sh
#
# Deploys to tmtprod.com VPS using rsync + nginx

set -e  # Exit on error

echo "==================================="
echo "Deploying Celeb Selfie to Production"
echo "==================================="

# SSH connection details
SERVER="root@185.97.144.211"
APP_DIR="/root/celeb-selfie"
NGINX_DIR="/var/www/celeb-selfie"

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "[1/6] Building production bundle locally..."
cd "$PROJECT_DIR"
npm run build

echo ""
echo "[2/6] Syncing source code to VPS via rsync..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.DS_Store' \
  "$PROJECT_DIR/" "$SERVER:$APP_DIR/"

echo ""
echo "[3/6] Syncing built dist/ to nginx directory..."
rsync -avz --delete \
  "$PROJECT_DIR/dist/" "$SERVER:$NGINX_DIR/"

echo ""
echo "[4/6] Setting proper file permissions..."
ssh $SERVER "chown -R www-data:www-data $NGINX_DIR 2>/dev/null || chown -R nginx:nginx $NGINX_DIR 2>/dev/null || echo 'Permission change skipped'"

echo ""
echo "[5/6] Reloading nginx configuration..."
ssh $SERVER "nginx -t && systemctl reload nginx || echo 'Nginx reload skipped (not configured yet)'"

echo ""
echo "[6/6] Verifying deployment..."
echo "Checking if files exist on VPS..."
ssh $SERVER "ls -lh $NGINX_DIR/index.html"

echo ""
echo "==================================="
echo "Deployment Complete!"
echo "==================================="
echo ""
echo "Verify at: https://celeb.tmtprod.com"
echo "Check nginx config: ssh $SERVER 'cat /etc/nginx/sites-available/celeb-selfie'"
echo "View files: ssh $SERVER 'ls -la $NGINX_DIR'"
echo ""
echo "NOTE: If this is first deployment, you need to:"
echo "1. Configure nginx site: /etc/nginx/sites-available/celeb-selfie"
echo "2. Enable site: ln -s /etc/nginx/sites-available/celeb-selfie /etc/nginx/sites-enabled/"
echo "3. Setup SSL: certbot --nginx -d celeb.tmtprod.com"
echo "4. Reload nginx: systemctl reload nginx"
