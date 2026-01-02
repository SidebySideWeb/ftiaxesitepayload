# Deployment Guide

This guide covers deploying the Payload CMS multi-tenant project to production.

## Prerequisites

- PostgreSQL database (production-ready)
- Environment variables configured
- Git repository pushed to GitHub

## Required Environment Variables

Make sure these are set in your production environment:

```bash
PAYLOAD_SECRET=your-secret-key-here
DATABASE_URI=postgresql://user:password@host:port/database
NODE_ENV=production
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository: `SidebySideWeb/ftiaxesitepayload`

2. **Configure environment variables:**
   - In Vercel project settings, add:
     - `PAYLOAD_SECRET` (generate a strong random string)
     - `DATABASE_URI` (your PostgreSQL connection string)
     - `NODE_ENV=production`

3. **Deploy:**
   - Vercel will automatically deploy on push to `main`
   - Or click "Deploy" in the Vercel dashboard

4. **Build Settings:**
   - Framework Preset: Next.js
   - Build Command: `pnpm build`
   - Install Command: `pnpm install`
   - Output Directory: `.next`

### Option 2: Docker Deployment

1. **Build the Docker image:**
   ```bash
   DOCKER_BUILD=true docker build -t cmsftiaxesite .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 \
     -e PAYLOAD_SECRET=your-secret \
     -e DATABASE_URI=your-database-uri \
     -e NODE_ENV=production \
     cmsftiaxesite
   ```

3. **For production with docker-compose:**
   - Update `docker-compose.yml` with production settings
   - Use environment variables from `.env.production`

### Option 3: Self-Hosted (Node.js)

1. **Build the project:**
   ```bash
   pnpm install
   pnpm build
   ```

2. **Start the production server:**
   ```bash
   pnpm start
   ```

3. **Use a process manager (PM2 recommended):**
   ```bash
   pm2 start npm --name "cmsftiaxesite" -- start
   pm2 save
   pm2 startup
   ```

## Post-Deployment Steps

1. **Run database migrations:**
   - The schema will auto-sync on first run
   - Ensure your PostgreSQL database is accessible

2. **Create admin user:**
   - Visit `/admin` on your deployed site
   - Create your first admin user

3. **Sync initial content (if needed):**
   ```bash
   pnpm sync:site -- --tenant kallitechnia
   ```

4. **Verify:**
   - Check `/admin` loads correctly
   - Test frontend pages
   - Verify media uploads work

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check PostgreSQL connection string format
- Verify Node.js version (18.20.2+ or 20.9.0+)

### Database Connection Issues
- Verify `DATABASE_URI` is correct
- Check PostgreSQL SSL settings
- Ensure database is accessible from deployment server

### Media Upload Issues
- Check file permissions
- Verify storage configuration
- Ensure media directory is writable

## Production Checklist

- [ ] Environment variables configured
- [ ] Database connection tested
- [ ] Build completes successfully
- [ ] Admin panel accessible
- [ ] Frontend pages load
- [ ] Media uploads work
- [ ] Forms submit correctly
- [ ] SSL certificate configured (if self-hosted)
- [ ] Domain configured
- [ ] Monitoring/logging set up
