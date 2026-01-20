# Celeb Selfie - Production Deployment Guide

## Server Details
- **VPS IP**: `185.97.144.211` (tmtprod.com)
- **Server Access**: `root@185.97.144.211`
- **App Directory**: `/root/celeb-selfie`
- **Web Directory**: `/var/www/celeb-selfie` (nginx serves from here)
- **Live URL**: https://celeb.tmtprod.com

## Quick Deploy

```bash
# From your local machine
./scripts/deploy-production.sh
```

This script will:
1. Build the production bundle locally (`npm run build`)
2. Sync source code to VPS at `/root/celeb-selfie`
3. Copy built files to nginx directory `/var/www/celeb-selfie`
4. Install dependencies on VPS
5. Reload nginx

## First-Time Setup (One-Time Only)

### 1. Create Directories on VPS

```bash
ssh root@185.97.144.211
mkdir -p /root/celeb-selfie
mkdir -p /var/www/celeb-selfie
```

### 2. Configure Nginx

```bash
# On VPS
cd /etc/nginx/sites-available
nano celeb-selfie
```

Copy the contents from `deployment/nginx-celeb-selfie.conf` into this file.

The domain `celeb.tmtprod.com` should already be configured.

### 3. Enable Site

```bash
# Create symlink
ln -s /etc/nginx/sites-available/celeb-selfie /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### 4. Setup SSL with Let's Encrypt

```bash
# Install certbot if not already installed
apt update
apt install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d celeb.tmtprod.com

# Certbot will automatically update your nginx config
```

### 5. Deploy!

```bash
# From your local machine
./scripts/deploy-production.sh
```

## Deployment Process

### Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# 1. Build locally
npm run build

# 2. Sync to VPS
rsync -avz --delete dist/ root@185.97.144.211:/var/www/celeb-selfie/

# 3. Reload nginx
ssh root@185.97.144.211 "systemctl reload nginx"
```

### Verify Deployment

1. **Check files exist**:
   ```bash
   ssh root@185.97.144.211 "ls -la /var/www/celeb-selfie"
   ```

2. **Check nginx status**:
   ```bash
   ssh root@185.97.144.211 "systemctl status nginx"
   ```

3. **Check nginx logs**:
   ```bash
   ssh root@185.97.144.211 "tail -f /var/log/nginx/celeb-selfie-access.log"
   ```

4. **Visit the site**:
   - HTTP: `http://185.97.144.211` or `http://celeb.tmtprod.com`
   - HTTPS (after SSL): `https://celeb.tmtprod.com`

## Environment Variables

The production build uses environment variables from `.env` at build time.

**Important**: Update `.env` before building if you changed:
- `VITE_REPLICATE_API_TOKEN`
- `VITE_GEMINI_API_KEY`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`
- `VITE_CLOUDINARY_API_KEY`
- `VITE_CORS_PROXY_URL`

See `.env.example` for required variables.

## Rollback

If deployment fails, rollback to previous version:

```bash
# On VPS, if you have backup
ssh root@185.97.144.211
cd /var/www/celeb-selfie
cp -r ../celeb-selfie-backup/* .
systemctl reload nginx
```

Or redeploy from a previous git commit:

```bash
git checkout <previous-commit-hash>
./scripts/deploy-production.sh
git checkout main  # Return to current branch
```

## Troubleshooting

### Issue: White screen / 404 errors

**Solution**: Check nginx configuration for SPA routing

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Issue: Assets not loading (404 on CSS/JS)

**Solution**: Check base path in `vite.config.js`

```javascript
export default defineConfig({
  base: '/',  // Should be '/' for root domain
})
```

### Issue: API calls failing (CORS errors)

**Solution**: Check environment variables are set correctly in `.env`

### Issue: rsync permission denied

**Solution**: Check SSH key is added

```bash
ssh-add -l  # List loaded keys
ssh root@185.97.144.211 "whoami"  # Test connection
```

## Monitoring

### Check Deployment Status

```bash
# Quick status check
ssh root@185.97.144.211 "ls -lh /var/www/celeb-selfie/index.html && systemctl status nginx | head -5"
```

### View Access Logs

```bash
ssh root@185.97.144.211 "tail -f /var/log/nginx/celeb-selfie-access.log"
```

### Check Disk Space

```bash
ssh root@185.97.144.211 "df -h /var/www"
```

## Notes

- The deployment script uses rsync for reliable file transfer
- Local build ensures consistent build environment
- Nginx serves static files (no Node.js runtime needed on VPS)
- SSL certificate auto-renews via certbot cron job
- The A record for celeb.tmtprod.com should point to 185.97.144.211

## Support

For deployment issues:
1. Check nginx error logs: `/var/log/nginx/celeb-selfie-error.log`
2. Verify file permissions: `ls -la /var/www/celeb-selfie`
3. Test nginx config: `nginx -t`
4. Check browser console for client-side errors
