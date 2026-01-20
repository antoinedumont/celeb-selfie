# Celeb Selfie - Traefik Deployment Guide

## Deployment Architecture

The VPS uses Traefik as a reverse proxy with automatic Let's Encrypt SSL certificates. Each application runs in a Docker container with Traefik labels for routing.

## Quick Deploy

```bash
# From your local machine
./scripts/deploy-production.sh
```

Then on the VPS:

```bash
ssh root@185.97.144.211
cd /root
docker compose up -d celeb-selfie
```

## First-Time Setup (Already Completed)

The following steps have been completed for celeb.tmtprod.com:

1. ✅ Created directories `/root/celeb-selfie` and `/var/www/celeb-selfie`
2. ✅ Copied nginx config to `/root/celeb-selfie-nginx.conf`
3. ✅ Added celeb-selfie service to `/root/docker-compose.yml`
4. ✅ Started container with Traefik routing
5. ✅ Traefik automatically obtained SSL certificate

## Docker Compose Configuration

The celeb-selfie service in `/root/docker-compose.yml`:

```yaml
celeb-selfie:
  image: nginx:alpine
  restart: always
  labels:
    - traefik.enable=true
    - traefik.http.routers.celeb.rule=Host(`celeb.tmtprod.com`)
    - traefik.http.routers.celeb.tls=true
    - traefik.http.routers.celeb.entrypoints=web,websecure
    - traefik.http.routers.celeb.tls.certresolver=mytlschallenge
    - traefik.http.services.celeb.loadbalancer.server.port=80
  volumes:
    - /var/www/celeb-selfie:/usr/share/nginx/html:ro
    - /root/celeb-selfie-nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

## Deployment Workflow

1. **Build locally**: `npm run build`
2. **Sync to VPS**: Rsync dist to `/var/www/celeb-selfie`
3. **Restart container**: `docker compose restart celeb-selfie`

Or use the automated script:

```bash
./scripts/deploy-production.sh
# Then manually restart the container
ssh root@185.97.144.211 "cd /root && docker compose restart celeb-selfie"
```

## Useful Commands

### Check Container Status
```bash
ssh root@185.97.144.211 "docker ps | grep celeb"
```

### View Logs
```bash
ssh root@185.97.144.211 "docker logs -f root-celeb-selfie-1"
```

### Restart Container
```bash
ssh root@185.97.144.211 "cd /root && docker compose restart celeb-selfie"
```

### Stop Container
```bash
ssh root@185.97.144.211 "cd /root && docker compose stop celeb-selfie"
```

### Update and Restart
```bash
# After running ./scripts/deploy-production.sh
ssh root@185.97.144.211 "cd /root && docker compose restart celeb-selfie"
```

### Check Traefik Routes
```bash
ssh root@185.97.144.211 "docker logs root-traefik-1 | grep celeb"
```

## Verify Deployment

```bash
# Check HTTP redirect
curl -I http://celeb.tmtprod.com

# Check HTTPS
curl -I https://celeb.tmtprod.com

# Check container is running
ssh root@185.97.144.211 "docker ps | grep celeb"

# Check files
ssh root@185.97.144.211 "ls -la /var/www/celeb-selfie/"
```

## Troubleshooting

### Site shows 404
- Check container is running: `docker ps | grep celeb`
- Check files exist: `ls -la /var/www/celeb-selfie/index.html`
- Restart container: `docker compose restart celeb-selfie`

### Container won't start
- Check logs: `docker logs root-celeb-selfie-1`
- Verify nginx config: `docker exec root-celeb-selfie-1 nginx -t`

### SSL certificate issues
- Check Traefik logs: `docker logs root-traefik-1`
- Traefik automatically manages SSL via Let's Encrypt
- Certificates stored in `/letsencrypt/acme.json`

### Changes not appearing
- Clear browser cache
- Check file timestamps: `ls -lh /var/www/celeb-selfie/`
- Restart container: `docker compose restart celeb-selfie`

## Environment Variables

Set in `.env` before building:
- `VITE_REPLICATE_API_TOKEN` - Replicate API token
- `VITE_GEMINI_API_KEY` - Google Gemini API key
- `VITE_CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `VITE_CLOUDINARY_UPLOAD_PRESET` - Cloudinary upload preset
- `VITE_CLOUDINARY_API_KEY` - Cloudinary API key

See `.env.example` for all variables.

## Live Site

- **URL**: https://celeb.tmtprod.com
- **Container**: `root-celeb-selfie-1`
- **Image**: `nginx:alpine`
- **Files**: `/var/www/celeb-selfie/`
- **Config**: `/root/celeb-selfie-nginx.conf`
