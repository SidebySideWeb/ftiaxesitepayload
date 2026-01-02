#!/bin/bash
# Hetzner Server Setup Script
# Run this script on your Hetzner server to set up the environment

set -e

echo "🚀 Setting up Hetzner server for Payload CMS deployment..."

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm

# Install PM2 for process management
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install PostgreSQL (if not already installed)
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo apt install -y postgresql postgresql-contrib
    echo "✅ PostgreSQL installed. Don't forget to set up your database!"
fi

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/cmsftiaxesite
sudo chown -R $USER:$USER /var/www/cmsftiaxesite

# Create PM2 ecosystem file
echo "📝 Creating PM2 configuration..."
cat > /var/www/cmsftiaxesite/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cmsftiaxesite',
    script: 'server.js',
    cwd: '/var/www/cmsftiaxesite',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/cmsftiaxesite-error.log',
    out_file: '/var/log/pm2/cmsftiaxesite-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
EOF

echo "✅ Server setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Set up PostgreSQL database and user"
echo "2. Configure environment variables in /var/www/cmsftiaxesite/.env"
echo "3. Clone your repository: git clone https://github.com/SidebySideWeb/ftiaxesitepayload.git /var/www/cmsftiaxesite"
echo "4. Run: cd /var/www/cmsftiaxesite && pnpm install && pnpm build"
echo "5. Configure Nginx (see deploy/nginx.conf)"
echo "6. Start the application: pm2 start ecosystem.config.js"
echo "7. Set up SSL: sudo certbot --nginx -d yourdomain.com"
