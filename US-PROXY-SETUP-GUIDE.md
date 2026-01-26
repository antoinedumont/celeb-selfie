# US Proxy Setup Guide

This guide will walk you through setting up the US-based VPS proxy to bypass EU geo-blocking.

## 🎯 What This Does

Routes Nano Banana Pro API requests through a US-based server to avoid celebrity content blocking in Europe.

**Cost**: ~$8/month (Hostinger KVM 1 VPS)
**Time**: ~45 minutes

---

## ✅ Prerequisites Checklist

Before starting, make sure you have:
- [ ] Hostinger account with billing info
- [ ] Access to tmtprod.com DNS settings
- [ ] SSH client (Terminal on Mac/Linux, PuTTY on Windows)
- [ ] ~$8/month budget for US VPS

---

## 📝 Step-by-Step Instructions

### Phase 1: Order and Access US VPS (15 minutes)

1. **Log into Hostinger**
   - Go to https://hostinger.com
   - Sign in to your account

2. **Order KVM 1 VPS**
   - Navigate to VPS section
   - Click "Add New VPS"
   - Select **KVM 1** plan (~$8/month)
   - **CRITICAL**: Choose **North America** datacenter location
   - Select Ubuntu 22.04 LTS or 24.04 LTS
   - Complete purchase

3. **Wait for Provisioning**
   - Usually takes 5-10 minutes
   - You'll receive email when ready
   - Note the VPS IP address from Hostinger panel

4. **Access VPS via SSH**
   ```bash
   # Get SSH credentials from Hostinger panel
   # Then connect:
   ssh root@YOUR_VPS_IP
   ```

### Phase 2: Install and Configure Proxy (20 minutes)

1. **Upload Configuration Files to VPS**

   From your local machine, upload the Nginx config:
   ```bash
   # Replace YOUR_VPS_IP with actual IP
   scp nginx-replicate-proxy.conf root@YOUR_VPS_IP:/etc/nginx/sites-available/replicate-proxy
   ```

2. **Run Setup Script**

   Option A - Upload and run the setup script:
   ```bash
   # On your local machine:
   scp setup-us-vps.sh root@YOUR_VPS_IP:/root/

   # Then on the VPS:
   ssh root@YOUR_VPS_IP
   chmod +x setup-us-vps.sh
   ./setup-us-vps.sh
   ```

   Option B - Manual setup (if you prefer step-by-step control):
   ```bash
   # On your VPS via SSH:

   # Update system
   apt update && apt upgrade -y

   # Install Nginx and Certbot
   apt install -y nginx certbot python3-certbot-nginx

   # Enable the site
   ln -s /etc/nginx/sites-available/replicate-proxy /etc/nginx/sites-enabled/

   # Test configuration
   nginx -t

   # Restart Nginx
   systemctl restart nginx
   ```

### Phase 3: Configure DNS (10 minutes)

1. **Add DNS Record**
   - Go to your DNS provider (where tmtprod.com is registered)
   - Add a new **A record**:
     - **Name/Host**: `us.api` (subdomain)
     - **Type**: A
     - **Value/Points to**: Your US VPS IP address
     - **TTL**: 300 (5 minutes)
   - Save changes

2. **Wait for DNS Propagation**
   - Usually takes 5-15 minutes
   - Test with: `dig us.api.tmtprod.com` or `nslookup us.api.tmtprod.com`
   - Should return your VPS IP address

3. **Setup SSL Certificate**
   ```bash
   # On your VPS via SSH:
   certbot --nginx -d us.api.tmtprod.com

   # Follow the prompts:
   # - Enter email address
   # - Agree to Terms of Service
   # - Choose redirect HTTP to HTTPS (option 2)
   ```

### Phase 4: Test the Proxy (5 minutes)

1. **Test from VPS**
   ```bash
   # On your VPS:
   curl https://us.api.tmtprod.com/v1/models \
     -H "Authorization: Bearer YOUR_REPLICATE_API_TOKEN"

   # Should return JSON list of Replicate models
   ```

2. **Test from Your Computer**
   ```bash
   # On your local machine:
   curl https://us.api.tmtprod.com/v1/models \
     -H "Authorization: Bearer YOUR_REPLICATE_API_TOKEN"

   # Should also return JSON list
   ```

3. **Verify Location**
   ```bash
   # On your VPS, verify it's actually in the US:
   curl ipinfo.io

   # Should show US location
   ```

---

## 🧪 Testing the Application

The code changes have already been made! Now test the app:

1. **Start Development Server**
   ```bash
   # In your celeb-selfie project directory:
   npm run dev
   ```

2. **Open Browser**
   - Navigate to http://localhost:5173
   - Open DevTools (F12) → Network tab

3. **Generate a Celebrity Selfie**
   - Take a selfie or upload an image
   - Select a celebrity (e.g., "Beyoncé")
   - Click "Generate"

4. **Check Network Traffic**
   - Look for requests to `us.api.tmtprod.com`
   - Should see successful API calls (200 OK)
   - No geo-blocking errors!

5. **Test Failover** (Optional)
   ```bash
   # Temporarily stop US proxy:
   ssh root@YOUR_VPS_IP
   systemctl stop nginx

   # Try generating another selfie
   # Should automatically failback to France proxy

   # Restart US proxy:
   systemctl start nginx
   ```

---

## 🚀 Production Deployment

### Option 1: Deploy to Vercel

1. **Set Environment Variables in Vercel Dashboard**
   - Go to your Vercel project settings
   - Add these environment variables:
     ```
     VITE_USE_CORS_PROXY=true
     VITE_US_CORS_PROXY_URL=https://us.api.tmtprod.com/
     VITE_CORS_PROXY_URL=https://api.tmtprod.com/replicate/
     VITE_REPLICATE_API_TOKEN=YOUR_REPLICATE_API_TOKEN
     VITE_GOOGLE_AI_STUDIO_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
     VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
     VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
     VITE_APP_PASSWORD=your_password
     ```

2. **Deploy**
   ```bash
   git add .
   git commit -m "Add US proxy for geo-blocking bypass"
   git push

   # Vercel will automatically rebuild and deploy
   ```

### Option 2: Build and Deploy Manually

1. **Build Production Bundle**
   ```bash
   npm run build
   ```

2. **Upload dist/ folder to your web server**

3. **Verify environment variables are set in production**

---

## 📊 Monitoring and Maintenance

### Check Proxy Status

```bash
# SSH to US VPS
ssh root@YOUR_VPS_IP

# Check Nginx status
systemctl status nginx

# View live logs
journalctl -u nginx -f

# Check for errors
grep error /var/log/nginx/error.log
```

### Useful Commands

```bash
# Restart Nginx
systemctl restart nginx

# Reload Nginx config (no downtime)
systemctl reload nginx

# Test Nginx config
nginx -t

# Check SSL certificate expiry
certbot certificates

# Renew SSL certificate (automatic, but manual if needed)
certbot renew

# Reboot VPS (if needed)
reboot
```

### Backup Nginx Config

```bash
# Save your config for safekeeping
scp root@YOUR_VPS_IP:/etc/nginx/sites-available/replicate-proxy \
    ~/backups/nginx-replicate-proxy-backup.conf
```

---

## 🔧 Troubleshooting

### Problem: DNS not resolving

**Symptoms**: `dig us.api.tmtprod.com` returns no IP

**Solutions**:
1. Wait longer (DNS can take up to 1 hour)
2. Check DNS record is correct in your provider
3. Clear local DNS cache:
   - Mac: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemd-resolve --flush-caches`
   - Windows: `ipconfig /flushdns`

### Problem: SSL certificate error

**Symptoms**: Certbot fails with "DNS resolution failed"

**Solutions**:
1. Ensure DNS is fully propagated first (test with `dig`)
2. Run certbot again: `certbot --nginx -d us.api.tmtprod.com`

### Problem: 502 Bad Gateway

**Symptoms**: Curl returns 502 error

**Solutions**:
1. Check Nginx config: `nginx -t`
2. View logs: `journalctl -u nginx -f`
3. Restart Nginx: `systemctl restart nginx`
4. Check if Nginx is running: `systemctl status nginx`

### Problem: Still getting geo-blocking

**Symptoms**: API returns content policy errors

**Solutions**:
1. Verify VPS is in US: `curl ipinfo.io` (from VPS)
2. Check app is using US proxy: Open DevTools → Network tab
3. Verify `.env` has `VITE_US_CORS_PROXY_URL` set
4. Rebuild app: `npm run dev` or `npm run build`

### Problem: App still using France proxy

**Symptoms**: Network tab shows `api.tmtprod.com` not `us.api.tmtprod.com`

**Solutions**:
1. Check `.env` file has US proxy URL
2. Restart dev server: Stop (Ctrl+C) and `npm run dev`
3. Clear browser cache and localStorage
4. Check browser console for errors

---

## 💰 Cost Breakdown

**Monthly Costs**:
- Hostinger KVM 1 VPS: ~$8/month
- SSL Certificate: $0 (Let's Encrypt is free)
- Bandwidth: $0 (unlimited with VPS)

**Total**: ~$8/month

**Annual**: ~$96/year

---

## ✅ Success Checklist

- [ ] US VPS ordered and provisioned
- [ ] Nginx installed and configured
- [ ] DNS record added and propagated
- [ ] SSL certificate installed
- [ ] Proxy responds to test requests
- [ ] Development server works with US proxy
- [ ] Celebrity generation works without geo-blocking
- [ ] Network tab shows requests to us.api.tmtprod.com
- [ ] Automatic failover works (optional test)
- [ ] Production deployment complete

---

## 📚 Quick Reference

**VPS Access**:
```bash
ssh root@YOUR_VPS_IP
```

**Test Proxy**:
```bash
curl https://us.api.tmtprod.com/v1/models \
  -H "Authorization: Bearer YOUR_REPLICATE_API_TOKEN"
```

**Nginx Commands**:
```bash
systemctl status nginx      # Check status
systemctl restart nginx     # Restart
journalctl -u nginx -f      # Live logs
nginx -t                    # Test config
```

**DNS Test**:
```bash
dig us.api.tmtprod.com
```

---

## 🎉 What You've Accomplished

After completing this setup:

✅ Bypassed EU geo-blocking for celebrity content
✅ Set up reliable US-based proxy infrastructure
✅ Implemented automatic failover to France proxy
✅ Minimal code changes (just 2 files!)
✅ Complete control over proxy infrastructure
✅ Under $10/month budget

Your Celebrity Selfie app now works seamlessly from Europe! 🎊
