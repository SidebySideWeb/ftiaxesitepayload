# Hetzner Server Deployment Guide

Complete guide for deploying Payload CMS to a Hetzner server.

## Prerequisites

- Hetzner server (Ubuntu 22.04 LTS recommended)
- SSH access to the server
- Domain name pointing to your server IP
- Basic knowledge of Linux commands

## Step 1: Initial Server Setup

### 1.1 Connect to your server

```bash
ssh root@your-server-ip
```

### 1.2 Run the setup script

```bash
# Clone the repository first
git clone https://github.com/SidebySideWeb/ftiaxesitepayload.git /var/www/cmsftiaxesite
cd /var/www/cmsftiaxesite

# Make scripts executable
chmod +x deploy/*.sh

# Run the server setup
./deploy/hetzner-setup.sh
```

This will install:
- Node.js 20.x
- pnpm
- PM2 (process manager)
- Nginx
- Certbot (for SSL)
- PostgreSQL

## Step 2: Database Setup

### 2.1 Set up PostgreSQL database

```bash
./deploy/postgres-setup.sh
```

Follow the prompts to:
- Create database
- Create database user
- Set password

**Save the connection string** - you'll need it for the `.env` file.

## Step 3: Configure Environment Variables

### 3.1 Create production `.env` file

```bash
cd /var/www/cmsftiaxesite
cp deploy/.env.production.example .env
nano .env
```

### 3.2 Fill in required variables

```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env:
PAYLOAD_SECRET=<generated-secret>
DATABASE_URI=postgresql://user:password@localhost:5432/database
NODE_ENV=production
PORT=3000
```

## Step 4: Install Dependencies and Build

```bash
cd /var/www/cmsftiaxesite

# Install dependencies
pnpm install

# Build the application
pnpm build
```

## Step 5: Configure Nginx

### 5.1 Update Nginx configuration

```bash
# Copy the configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/cmsftiaxesite

# Edit and replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/cmsftiaxesite
```

### 5.2 Enable the site

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/cmsftiaxesite /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 6: Set Up SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update your Nginx config
# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 7: Start the Application

### 7.1 Start with PM2

```bash
cd /var/www/cmsftiaxesite
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

### 7.2 Verify it's running

```bash
# Check status
pm2 status

# View logs
pm2 logs cmsftiaxesite

# Monitor
pm2 monit
```

## Step 8: Verify Deployment

1. **Check application is running:**
   ```bash
   curl http://localhost:3000
   ```

2. **Visit your domain:**
   - Frontend: `https://yourdomain.com`
   - Admin: `https://yourdomain.com/admin`

3. **Create admin user:**
   - Go to `/admin`
   - Create your first admin account

## Step 9: Initial Content Sync (Optional)

If you need to sync content from the sync pack:

```bash
cd /var/www/cmsftiaxesite
pnpm sync:site -- --tenant kallitechnia
```

## Ongoing Deployments

### Option 1: Deploy from local machine

```bash
# From your local machine
./deploy/deploy.sh root@your-server-ip
```

### Option 2: Deploy directly on server

```bash
# SSH into server
ssh root@your-server-ip

# Navigate to app directory
cd /var/www/cmsftiaxesite

# Pull latest changes
git pull origin main

# Install and build
pnpm install
pnpm build

# Restart
pm2 restart cmsftiaxesite
```

## Useful Commands

### PM2 Management

```bash
# View status
pm2 status

# View logs
pm2 logs cmsftiaxesite

# Restart
pm2 restart cmsftiaxesite

# Stop
pm2 stop cmsftiaxesite

# Monitor
pm2 monit
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Restart
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/cmsftiaxesite-error.log
```

### Database Management

```bash
# Connect to database
sudo -u postgres psql -d cmsftiaxesite

# Backup database
pg_dump -U payload cmsftiaxesite > backup.sql

# Restore database
psql -U payload cmsftiaxesite < backup.sql
```

## Troubleshooting

### Application won't start

1. Check PM2 logs:
   ```bash
   pm2 logs cmsftiaxesite --lines 50
   ```

2. Verify environment variables:
   ```bash
   cat /var/www/cmsftiaxesite/.env
   ```

3. Test database connection:
   ```bash
   psql $DATABASE_URI
   ```

### Nginx 502 Bad Gateway

1. Check if app is running:
   ```bash
   pm2 status
   ```

2. Check app logs:
   ```bash
   pm2 logs cmsftiaxesite
   ```

3. Verify port 3000 is listening:
   ```bash
   netstat -tlnp | grep 3000
   ```

### SSL Certificate Issues

1. Check certificate status:
   ```bash
   sudo certbot certificates
   ```

2. Renew manually:
   ```bash
   sudo certbot renew
   ```

### Database Connection Errors

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Check connection string format
3. Verify user permissions:
   ```bash
   sudo -u postgres psql -c "\du"
   ```

## Security Checklist

- [ ] Firewall configured (UFW recommended)
- [ ] SSH key authentication only
- [ ] Strong passwords for database
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Fail2ban installed (optional but recommended)
- [ ] Regular database backups configured

## Backup Strategy

### Automated Backup Script

Create `/var/www/cmsftiaxesite/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cmsftiaxesite"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U payload cmsftiaxesite > $BACKUP_DIR/db_$DATE.sql

# Backup media files (if stored locally)
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /var/www/cmsftiaxesite/public/media

# Keep only last 7 days
find $BACKUP_DIR -type f -mtime +7 -delete
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /var/www/cmsftiaxesite/backup.sh
```

## Performance Optimization

1. **Enable Nginx caching** (already configured)
2. **PM2 cluster mode** (for multi-core servers):
   ```javascript
   // ecosystem.config.js
   instances: 'max',
   exec_mode: 'cluster'
   ```
3. **Database indexing** (Payload handles this automatically)
4. **CDN for media** (consider Cloudflare or similar)

## Monitoring

Consider setting up:
- **PM2 Plus** (free monitoring)
- **Uptime monitoring** (UptimeRobot, Pingdom)
- **Error tracking** (Sentry)
- **Log aggregation** (optional)

## Support

For issues:
1. Check PM2 logs: `pm2 logs cmsftiaxesite`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/cmsftiaxesite-error.log`
3. Verify environment variables
4. Test database connection
