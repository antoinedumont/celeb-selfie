#!/bin/bash
# Setup script for US-based VPS proxy
# Run this on your Hostinger US VPS after SSH connection

set -e  # Exit on error

echo "=========================================="
echo "Setting up US Replicate Proxy on VPS"
echo "=========================================="
echo ""

# Update system
echo "[1/5] Updating system packages..."
apt update && apt upgrade -y

# Install Nginx and Certbot
echo "[2/5] Installing Nginx and Certbot..."
apt install -y nginx certbot python3-certbot-nginx

# Copy Nginx configuration
echo "[3/5] Configuring Nginx..."
echo "Please upload nginx-replicate-proxy.conf to /etc/nginx/sites-available/replicate-proxy"
echo "Then run: ln -s /etc/nginx/sites-available/replicate-proxy /etc/nginx/sites-enabled/"
read -p "Press Enter when you've uploaded the config file..."

# Test Nginx configuration
echo "[4/5] Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid!"
    systemctl restart nginx
    echo "Nginx restarted successfully!"
else
    echo "ERROR: Nginx configuration is invalid. Please check the config file."
    exit 1
fi

# Setup SSL
echo "[5/5] Setting up SSL certificate..."
echo "Make sure DNS for us.api.tmtprod.com is pointing to this server's IP!"
read -p "Press Enter to continue with SSL setup..."

certbot --nginx -d us.api.tmtprod.com

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Your US proxy is now running at: https://us.api.tmtprod.com"
    echo ""
    echo "Test it with:"
    echo "  curl https://us.api.tmtprod.com/v1/models -H \"Authorization: Bearer YOUR_TOKEN\""
    echo ""
    echo "Useful commands:"
    echo "  - Check Nginx status: systemctl status nginx"
    echo "  - View Nginx logs: journalctl -u nginx -f"
    echo "  - Restart Nginx: systemctl restart nginx"
    echo "  - Test config: nginx -t"
    echo ""
else
    echo "ERROR: SSL setup failed. Make sure DNS is properly configured."
    exit 1
fi
