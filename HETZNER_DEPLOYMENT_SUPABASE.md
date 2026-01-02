# Hetzner Server Deployment with Supabase

Deployment guide for Payload CMS on Hetzner using Supabase PostgreSQL database.

## Prerequisites

- Hetzner server (Ubuntu 22.04 LTS recommended)
- Supabase project with PostgreSQL database
- SSH access to the server
- Domain name pointing to your server IP

## Step 1: Pull Latest Code

```bash
cd /var/www/ftiaxesitepayload
git pull origin main
chmod +x deploy/*.sh
```

## Step 2: Initial Server Setup

Run the setup script (this installs Node.js, pnpm, PM2, Nginx, and Certbot):

```bash
./deploy/hetzner-setup.sh
```

**Note:** This script installs PostgreSQL, but you can skip that since you're using Supabase.

## Step 3: Get Your Supabase Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Project Settings** > **Database**
3. Scroll to **Connection string** section
4. Select **URI** mode
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   
   Or for direct connection:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

6. Replace `[YOUR-PASSWORD]` with your actual database password

## Step 4: Configure Environment Variables

```bash
cd /var/www/ftiaxesitepayload
cp deploy/env.production.example .env
nano .env
```

Fill in your values:

```bash
# Generate a secure secret
PAYLOAD_SECRET=<run: openssl rand -base64 32>

# Your Supabase connection string (from Step 3)
DATABASE_URI=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Node Environment
NODE_ENV=production
PORT=3000
```

**Important:** Make sure to URL-encode your password if it contains special characters.

## Step 5: Install Dependencies and Build

```bash
# Install dependencies
pnpm install

# Build the application
pnpm build
```

## Step 6: Configure Nginx

```bash
# Edit the nginx config with your domain
nano deploy/nginx.conf
# Replace 'yourdomain.com' with your actual domain

# Copy to nginx sites
sudo cp deploy/nginx.conf /etc/nginx/sites-available/cmsftiaxesite
sudo ln -s /etc/nginx/sites-available/cmsftiaxesite /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Step 7: Set Up SSL with Let's Encrypt

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update your Nginx config
# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 8: Start the Application

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

## Step 9: Verify Deployment

1. **Check application is running:**
   ```bash
   pm2 status
   pm2 logs cmsftiaxesite
   ```

2. **Test locally:**
   ```bash
   curl http://localhost:3000
   ```

3. **Visit your domain:**
   - Frontend: `https://yourdomain.com`
   - Admin: `https://yourdomain.com/admin`

4. **Create admin user:**
   - Go to `/admin`
   - Create your first admin account

## Step 10: Initial Content Sync (Optional)

If you need to sync content from the sync pack:

```bash
cd /var/www/ftiaxesitepayload
pnpm sync:site -- --tenant kallitechnia
```

## Supabase-Specific Notes

### Connection Pooling

Supabase offers connection pooling. For production, you might want to use the pooler connection string:

- **Session mode** (for migrations): `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Transaction mode** (for app): `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`

For Payload CMS, use the **direct connection** (Session mode) as it handles connections efficiently.

### SSL Connection

Supabase requires SSL connections. The Payload config already has SSL configured:

```typescript
db: postgresAdapter({
  pool: {
    connectionString: process.env.DATABASE_URI,
    ssl: {
      rejectUnauthorized: false,
    },
  },
}),
```

### Database Extensions

Supabase comes with common extensions pre-installed. If you need additional ones, you can enable them in the Supabase dashboard under **Database** > **Extensions**.

### IP Allowlist (if needed)

If you encounter connection issues, check Supabase's **Project Settings** > **Database** > **Connection pooling** and ensure your Hetzner server IP is allowed (or use the pooler which doesn't require IP allowlisting).

## Troubleshooting

### Database Connection Errors

1. **Verify connection string:**
   ```bash
   # Test connection from server
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

2. **Check SSL settings** - Make sure `rejectUnauthorized: false` is set in Payload config

3. **Verify password** - Ensure password is URL-encoded if it contains special characters

4. **Check Supabase status** - Visit status.supabase.com

### Application Won't Start

1. Check PM2 logs:
   ```bash
   pm2 logs cmsftiaxesite --lines 50
   ```

2. Verify environment variables:
   ```bash
   cat .env
   ```

3. Test database connection:
   ```bash
   # Install psql client if needed
   sudo apt install postgresql-client
   
   # Test connection
   psql $DATABASE_URI
   ```

## Ongoing Deployments

### Deploy from Local Machine

```bash
# From your local machine
./deploy/deploy.sh root@your-server-ip
```

### Deploy Directly on Server

```bash
# SSH into server
ssh root@your-server-ip

# Navigate to app directory
cd /var/www/ftiaxesitepayload

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
pm2 status
pm2 logs cmsftiaxesite
pm2 restart cmsftiaxesite
pm2 stop cmsftiaxesite
pm2 monit
```

### Nginx Management

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/cmsftiaxesite-error.log
```

## Security Checklist

- [ ] Firewall configured (UFW recommended)
- [ ] SSH key authentication only
- [ ] Strong `PAYLOAD_SECRET` generated
- [ ] `.env` file permissions: `chmod 600 .env`
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] SSL certificate configured
- [ ] Supabase database password is strong
- [ ] Supabase project has proper access controls
