# 🚀 LuxeCraft VPS Deployment Guide

**Target**: Ubuntu 24.04 LTS VPS (Google Cloud / AWS / DigitalOcean)

---

## Prerequisites

- Ubuntu 24.04 LTS server with root/sudo access
- Domain name pointing to server IP
- Minimum 2GB RAM, 2 CPU cores
- 20GB+ storage

---

## Step 1: Initial Server Setup

```bash
# SSH into your server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl git build-essential ufw
```

---

## Step 2: Install Node.js (v20)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
```

---

## Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER luxecraft WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
CREATE DATABASE luxecraft_prod OWNER luxecraft;
GRANT ALL PRIVILEGES ON DATABASE luxecraft_prod TO luxecraft;
\\q
EOF
```

---

## Step 4: Install Redis

```bash
# Install Redis
sudo apt install -y redis-server

# Configure Redis (optional: set password)
sudo nano /etc/redis/redis.conf
# Find and set: requirepass YOUR_REDIS_PASSWORD

# Restart Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test
redis-cli ping  # Should return PONG
```

---

## Step 5: Install PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify
pm2 --version
```

---

## Step 6: Clone Repository

```bash
# Create app directory
sudo mkdir -p /var/www/luxecraft
sudo chown -R $USER:$USER /var/www/luxecraft

# Clone repo
cd /var/www
git clone https://github.com/Shakir120795/luxecraft-fix.git luxecraft
cd luxecraft
```

---

## Step 7: Configure Environment Variables

```bash
# Create production environment file
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

**Required values**:
```env
NODE_ENV=production

# Ports
API_PORT=3001
STOREFRONT_PORT=3003
ADMIN_PORT=3002

# Database
DATABASE_URL=postgresql://luxecraft:YOUR_STRONG_PASSWORD_HERE@localhost:5432/luxecraft_prod

# Redis
REDIS_URL=redis://:YOUR_REDIS_PASSWORD@localhost:6379

# JWT Secrets (generate with: openssl rand -base64 64)
JWT_SECRET=YOUR_64_CHAR_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_ANOTHER_64_CHAR_SECRET_HERE
ADMIN_JWT_SECRET=YOUR_ADMIN_SECRET_HERE
ADMIN_JWT_REFRESH_SECRET=YOUR_ADMIN_REFRESH_SECRET_HERE

# CORS (your domains)
CORS_ORIGINS=https://luxecraft.com,https://admin.luxecraft.com

# SMTP (your email provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD

# Payment (Stripe)
PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend URLs
NEXT_PUBLIC_API_URL=https://api.luxecraft.com/api/v1
NEXT_PUBLIC_STOREFRONT_URL=https://luxecraft.com
```

---

## Step 8: Install Dependencies & Build

```bash
# Install all dependencies
npm install

# Build API
npm run build:api

# Build Storefront
npm run build:storefront

# Build Admin
npm run build:admin
```

---

## Step 9: Run Database Migrations

```bash
# Navigate to API directory
cd apps/api

# Run Prisma migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (creates super admin)
npm run db:seed

# Return to root
cd ../..
```

---

## Step 10: Create PM2 Ecosystem File

```bash
nano pm2.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'luxecraft-api',
      cwd: '/var/www/luxecraft/apps/api',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        API_PORT: 3001,
      },
      error_file: '/var/www/luxecraft/logs/api-error.log',
      out_file: '/var/www/luxecraft/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'luxecraft-storefront',
      cwd: '/var/www/luxecraft/apps/storefront',
      script: 'server-production.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        STOREFRONT_PORT: 3003,
      },
      error_file: '/var/www/luxecraft/logs/storefront-error.log',
      out_file: '/var/www/luxecraft/logs/storefront-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'luxecraft-admin',
      cwd: '/var/www/luxecraft/apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start -p 3002',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        ADMIN_PORT: 3002,
      },
      error_file: '/var/www/luxecraft/logs/admin-error.log',
      out_file: '/var/www/luxecraft/logs/admin-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
```

---

## Step 11: Start Applications with PM2

```bash
# Create logs directory
mkdir -p logs

# Start all apps
pm2 start pm2.config.js

# Check status
pm2 status

# Save PM2 configuration
pm2 save

# Generate startup script (auto-start on boot)
pm2 startup
# Run the command it outputs (sudo env PATH=...)

# Verify startup
pm2 list
```

---

## Step 12: Install & Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create API configuration
sudo nano /etc/nginx/sites-available/api.luxecraft.com
```

```nginx
server {
    listen 80;
    server_name api.luxecraft.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Create Storefront configuration
sudo nano /etc/nginx/sites-available/luxecraft.com
```

```nginx
server {
    listen 80;
    server_name luxecraft.com www.luxecraft.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Create Admin configuration
sudo nano /etc/nginx/sites-available/admin.luxecraft.com
```

```nginx
server {
    listen 80;
    server_name admin.luxecraft.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/api.luxecraft.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/luxecraft.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/admin.luxecraft.com /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Step 13: Install SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificates
sudo certbot --nginx -d api.luxecraft.com
sudo certbot --nginx -d luxecraft.com -d www.luxecraft.com
sudo certbot --nginx -d admin.luxecraft.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Step 14: Configure Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 15: Final Verification

```bash
# Check all services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server

# Check logs
pm2 logs luxecraft-api --lines 50
pm2 logs luxecraft-storefront --lines 50
pm2 logs luxecraft-admin --lines 50

# Test URLs
curl https://api.luxecraft.com/api/v1/health
curl https://luxecraft.com
curl https://admin.luxecraft.com
```

---

## Common PM2 Commands

```bash
# View logs
pm2 logs
pm2 logs luxecraft-api
pm2 logs luxecraft-api --lines 100

# Restart apps
pm2 restart all
pm2 restart luxecraft-api

# Stop apps
pm2 stop all
pm2 stop luxecraft-storefront

# Monitor
pm2 monit

# List apps
pm2 list

# Delete apps
pm2 delete luxecraft-api

# Reload (zero downtime)
pm2 reload all
```

---

## Updating Code

```bash
cd /var/www/luxecraft

# Pull latest code
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild
npm run build:api
npm run build:storefront
npm run build:admin

# Run migrations (if any)
cd apps/api
npx prisma migrate deploy
cd ../..

# Reload PM2 (zero downtime)
pm2 reload all

# Check logs for errors
pm2 logs --lines 50
```

---

## Backup & Restore

### Database Backup
```bash
# Create backup directory
mkdir -p /var/backups/luxecraft

# Backup database
pg_dump -U luxecraft -h localhost luxecraft_prod > /var/backups/luxecraft/db-$(date +%Y%m%d-%H%M%S).sql

# Automate with cron
crontab -e
# Add: 0 2 * * * pg_dump -U luxecraft luxecraft_prod > /var/backups/luxecraft/db-$(date +%Y%m%d).sql
```

### Restore Database
```bash
psql -U luxecraft -h localhost -d luxecraft_prod < /var/backups/luxecraft/db-20241224.sql
```

---

## Monitoring

### Check Application Health
```bash
# API health
curl https://api.luxecraft.com/api/v1/health

# Check error logs
tail -f /var/www/luxecraft/logs/api-error.log

# Check Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Troubleshooting

### App not starting
```bash
pm2 logs luxecraft-api --err
cd /var/www/luxecraft/apps/api
node dist/main.js  # Run directly to see errors
```

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
pm2 restart luxecraft-api
```

### Database connection error
```bash
# Test PostgreSQL
psql -U luxecraft -h localhost -d luxecraft_prod

# Check password in .env.production
cat .env.production | grep DATABASE_URL
```

### SSL certificate issues
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

---

## Security Checklist

- [ ] ✅ Firewall (UFW) enabled
- [ ] ✅ SSH key-based authentication (disable password login)
- [ ] ✅ SSL/HTTPS enabled
- [ ] ✅ Strong database password
- [ ] ✅ Strong JWT secrets
- [ ] ✅ Redis password set
- [ ] ✅ `.env.production` permissions set to 600
- [ ] ✅ Fail2ban installed (optional but recommended)
- [ ] ✅ Automated backups configured
- [ ] ✅ Monitoring/alerts set up

---

## Performance Tips

1. **Enable Nginx caching** for static assets
2. **Use Redis** for session storage
3. **Enable gzip** compression in Nginx
4. **Set up CDN** (Cloudflare) for images
5. **Database indexing** - Already done in Prisma schema
6. **PM2 cluster mode** - Already configured (2 instances)

---

**Deployment Complete!** 🎉

Your LuxeCraft platform is now running on:
- **API**: https://api.luxecraft.com
- **Storefront**: https://luxecraft.com
- **Admin**: https://admin.luxecraft.com
