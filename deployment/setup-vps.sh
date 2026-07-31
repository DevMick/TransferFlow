#!/bin/bash
set -e

# TransferFlow VPS Setup Script
# Run this script once on your Ubuntu 24.04 VPS as root
# Usage: curl -fsSL https://raw.githubusercontent.com/DevMick/TransferFlow/main/deployment/setup-vps.sh | bash

echo "🚀 TransferFlow VPS Setup Starting..."

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y curl wget git nano htop

# Install Node.js 22
echo "📦 Installing Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@10

# Install PostgreSQL
echo "📦 Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Create PostgreSQL user and database
echo "📦 Creating PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE USER transferflow WITH PASSWORD 'generate-secure-password-here';
CREATE DATABASE transferflow_prod OWNER transferflow;
ALTER ROLE transferflow WITH CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE transferflow_prod TO transferflow;
EOF

# Install Nginx
echo "📦 Installing Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# Create application directory
echo "📦 Creating application directory..."
mkdir -p /var/www/transfertsecur.com/app
mkdir -p /var/www/transfertsecur.com/web
mkdir -p /var/log/transferflow

# Create transferflow user
echo "📦 Creating transferflow system user..."
useradd -m -d /var/www/transfertsecur.com -s /bin/bash transferflow || true
chown -R transferflow:transferflow /var/www/transfertsecur.com
chown -R transferflow:transferflow /var/log/transferflow

# Setup SSH key for GitHub deployments
echo "📦 Generating SSH key for GitHub..."
sudo -u transferflow ssh-keygen -t ed25519 -f /var/www/transfertsecur.com/.ssh/id_ed25519 -N "" || true
echo ""
echo "⚠️  ADD THIS SSH KEY TO GITHUB:"
echo "=================================================="
cat /var/www/transfertsecur.com/.ssh/id_ed25519.pub
echo "=================================================="
echo ""
echo "Instructions:"
echo "1. Go to: https://github.com/DevMick/TransferFlow/settings/keys"
echo "2. Click 'Add deploy key'"
echo "3. Paste the key above"
echo "4. Check 'Allow write access'"
echo ""

# Configure Nginx
echo "📦 Configuring Nginx..."
cp /tmp/nginx-transfertsecur.conf /etc/nginx/sites-available/transfertsecur.com
ln -sf /etc/nginx/sites-available/transfertsecur.com /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Setup SSL certificate
echo "📦 Setting up SSL with Let's Encrypt..."
certbot certonly --nginx -d transfertsecur.com -d www.transfertsecur.com --non-interactive --agree-tos -m support@transfertsecur.com

# Setup auto-renewal
systemctl enable certbot.timer
systemctl start certbot.timer

# Create .env file
echo "📦 Creating environment configuration..."
cat > /var/www/transfertsecur.com/app/.env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://transferflow:your-secure-password@localhost:5432/transferflow_prod"
JWT_SECRET="generate-a-secure-random-string-here"
CORS_ORIGIN="https://transfertsecur.com"
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="support@transfertsecur.com"
SMTP_PASS="Amour##v22@"
EOF

chown transferflow:transferflow /var/www/transfertsecur.com/app/.env
chmod 600 /var/www/transfertsecur.com/app/.env

# Setup systemd service
echo "📦 Setting up systemd service..."
cp /tmp/systemd-transferflow-api.service /etc/systemd/system/transferflow-api.service
systemctl daemon-reload
systemctl enable transferflow-api

# Setup log rotation
echo "📦 Setting up log rotation..."
cat > /etc/logrotate.d/transferflow << 'EOF'
/var/log/transferflow/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 transferflow transferflow
    sharedscripts
    postrotate
        systemctl reload transferflow-api > /dev/null 2>&1 || true
    endscript
}
EOF

# Setup firewall (UFW)
echo "📦 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5432/tcp from 127.0.0.1
ufw --force enable

# Create deployment directory structure
echo "📦 Creating deployment directories..."
mkdir -p /var/www/transfertsecur.com/app/{dist,apps/api/dist,apps/web/dist}
chown -R transferflow:transferflow /var/www/transfertsecur.com

echo ""
echo "✅ VPS Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Add SSH deploy key to GitHub (shown above)"
echo "2. Update DATABASE_URL in /var/www/transfertsecur.com/app/.env"
echo "3. Update JWT_SECRET in .env with a secure random string"
echo "4. Verify Nginx: nginx -t"
echo "5. Test deployment manually:"
echo "   cd /var/www/transfertsecur.com/app"
echo "   git clone git@github.com:DevMick/TransferFlow.git ."
echo "   pnpm install --frozen-lockfile"
echo "   pnpm build"
echo "   pnpm db:migrate"
echo "   systemctl start transferflow-api"
echo "6. Check service: systemctl status transferflow-api"
echo ""
echo "🔗 Your site will be available at: https://transfertsecur.com"
