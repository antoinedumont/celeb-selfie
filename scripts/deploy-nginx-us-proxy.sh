#!/bin/bash
# Deploy nginx configuration to US VPS proxy
# Server: 76.13.97.11 (us.api.tmtprod.com)

set -e

VPS_HOST="76.13.97.11"
VPS_USER="root"
NGINX_CONFIG="nginx-replicate-proxy.conf"
REMOTE_CONFIG_PATH="/etc/nginx/sites-available/api-proxy"
REMOTE_ENABLED_PATH="/etc/nginx/sites-enabled/api-proxy"

echo "🚀 Deploying nginx configuration to US VPS..."
echo "   Host: $VPS_HOST"
echo "   Config: $NGINX_CONFIG"
echo ""

# Check if local config file exists
if [ ! -f "$NGINX_CONFIG" ]; then
    echo "❌ Error: $NGINX_CONFIG not found in current directory"
    exit 1
fi

# Display config diff (optional)
echo "📝 Configuration to deploy:"
echo "---"
cat "$NGINX_CONFIG"
echo "---"
echo ""

read -p "Deploy this configuration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "1️⃣  Copying configuration to VPS..."
scp "$NGINX_CONFIG" "${VPS_USER}@${VPS_HOST}:${REMOTE_CONFIG_PATH}"

echo ""
echo "2️⃣  Testing nginx configuration..."
ssh "${VPS_USER}@${VPS_HOST}" "nginx -t"

echo ""
echo "3️⃣  Creating symlink in sites-enabled..."
ssh "${VPS_USER}@${VPS_HOST}" "ln -sf ${REMOTE_CONFIG_PATH} ${REMOTE_ENABLED_PATH}"

echo ""
echo "4️⃣  Reloading nginx..."
ssh "${VPS_USER}@${VPS_HOST}" "systemctl reload nginx"

echo ""
echo "5️⃣  Checking nginx status..."
ssh "${VPS_USER}@${VPS_HOST}" "systemctl status nginx --no-pager | head -20"

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📡 Proxy endpoints:"
echo "   - Replicate: https://us.api.tmtprod.com/replicate/"
echo "   - Google AI: https://us.api.tmtprod.com/google/"
echo ""
echo "🧪 Test commands:"
echo "   curl -I https://us.api.tmtprod.com/replicate/"
echo "   curl -I https://us.api.tmtprod.com/google/"
