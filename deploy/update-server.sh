#!/bin/bash
# Quick update script to run on the Hetzner server
# SSH into server and run: bash update-server.sh

set -e

APP_DIR="/var/www/cmsftiaxesite"

echo "🚀 Updating CMS on Hetzner server..."
echo ""

cd $APP_DIR

echo "📦 Pulling latest changes from git..."
git fetch origin
git reset --hard origin/main

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --production=false

echo "🔨 Building application..."
pnpm build

echo "🔄 Restarting application with PM2..."
pm2 restart cmsftiaxesite || pm2 start ecosystem.config.js

pm2 save

echo ""
echo "✅ Update complete!"
echo ""
echo "📊 Check status: pm2 status"
echo "📋 View logs: pm2 logs cmsftiaxesite --lines 50"
