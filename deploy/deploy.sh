#!/bin/bash
# Deployment script for Hetzner server
# Run this script from your local machine or on the server
# Usage: ./deploy/deploy.sh [server-user@server-ip]

set -e

# Configuration
SERVER_USER="${1:-root}"
SERVER_IP="${2}"
APP_DIR="/var/www/cmsftiaxesite"
REPO_URL="https://github.com/SidebySideWeb/ftiaxesitepayload.git"
BRANCH="main"

if [ -z "$SERVER_IP" ]; then
    echo "❌ Error: Server IP required"
    echo "Usage: ./deploy/deploy.sh [user@]server-ip"
    exit 1
fi

echo "🚀 Deploying to Hetzner server: $SERVER_USER@$SERVER_IP"
echo "📁 Target directory: $APP_DIR"
echo ""

# Check if we're deploying from local or server
if [ "$SERVER_USER" = "local" ]; then
    # Local deployment - SSH into server and run commands
    echo "📤 Deploying from local machine..."
    
    ssh $SERVER_USER@$SERVER_IP << EOF
        set -e
        echo "📦 Updating repository..."
        cd $APP_DIR
        
        # Pull latest changes
        git fetch origin
        git reset --hard origin/$BRANCH
        
        # Install dependencies
        echo "📦 Installing dependencies..."
        pnpm install --frozen-lockfile --production=false
        
        # Build the application
        echo "🔨 Building application..."
        pnpm build
        
        # Restart PM2
        echo "🔄 Restarting application..."
        pm2 restart cmsftiaxesite || pm2 start ecosystem.config.js
        
        # Save PM2 configuration
        pm2 save
        
        echo "✅ Deployment complete!"
EOF
else
    # Server-side deployment
    echo "📤 Running deployment on server..."
    
    cd $APP_DIR
    
    echo "📦 Updating repository..."
    git fetch origin
    git reset --hard origin/$BRANCH
    
    echo "📦 Installing dependencies..."
    pnpm install --frozen-lockfile --production=false
    
    echo "🔨 Building application..."
    pnpm build
    
    echo "🔄 Restarting application..."
    pm2 restart cmsftiaxesite || pm2 start ecosystem.config.js
    
    pm2 save
    
    echo "✅ Deployment complete!"
fi

echo ""
echo "🎉 Application deployed successfully!"
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs cmsftiaxesite"
