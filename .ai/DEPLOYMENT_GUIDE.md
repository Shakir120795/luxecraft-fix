# LuxeCraft Deployment Guide

## Overview

This guide covers deployment of LuxeCraft ecommerce platform to production environment.

**Applications:**
- API Server (NestJS) — Backend REST API
- Storefront (Next.js) — Customer-facing store
- Admin (Next.js) — Admin management panel

**Infrastructure:**
- PostgreSQL 16 — Primary database
- Redis 7 — Cache & queue storage
- Nginx — Reverse proxy & SSL termination

---

## Prerequisites

### Required Services
- [ ] PostgreSQL 16+ database
- [ ] Redis 7+ instance
- [ ] Node.js 20+ runtime
- [ ] Domain names configured
- [ ] SSL certificates

### Environment Variables

Create production `.env` files for each application:

**API Server (`apps/api/.env.production`):**
```env
# Application
NODE_ENV=production
PORT=3001
APP_NAME=LuxeCraft
APP_URL=https://api.luxecraft.com

# Database
DATABASE_URL=postgresql://user:password@host:5432/luxecraft_prod?schema=public

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT Secrets (generate strong secrets)
JWT_SECRET=your-strong-jwt-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-strong-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=30d

# Admin JWT (separate from customer)
ADMIN_JWT_SECRET=your-admin-jwt-secret-here
ADMIN_JWT_EXPIRES_IN=8h
ADMIN_JWT_REFRESH_SECRET=your-admin-refresh-secret-here
ADMIN_JWT_REFRESH_EXPIRES_IN=7d

# Initial Super Admin
SUPER_ADMIN_EMAIL=admin@luxecraft.com
SUPER_ADMIN_PASSWORD=your-secure-password-here
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin

# CORS
CORS_ORIGINS=https://luxecraft.com,https://admin.luxecraft.com

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Email (configure your provider)
EMAIL_FROM=noreply@luxecraft.com
# Add email provider credentials here

# Object Storage (configure your provider)
# Add S3/DigitalOcean Spaces/Cloudinary credentials here
```

**Storefront (`apps/storefront/.env.production`):**
```env
NEXT_PUBLIC_API_URL=https://api.luxecraft.com/api/v1
NEXT_PUBLIC_SITE_URL=https://luxecraft.com
NEXT_PUBLIC_SITE_NAME=LuxeCraft
```

**Admin (`apps/admin/.env.production`):**
```env
NEXT_PUBLIC_API_URL=https://api.luxecraft.com/api/v1
NEXT_PUBLIC_SITE_URL=https://admin.luxecraft.com
NEXT_PUBLIC_SITE_NAME=LuxeCraft Admin
```

---

## Deployment Steps

### 1. Database Setup

```bash
# Connect to your PostgreSQL server
psql -h your-db-host -U postgres

# Create production database
CREATE DATABASE luxecraft_prod;
CREATE USER luxecraft_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE luxecraft_prod TO luxecraft_user;
\q

# Run Prisma migrations
cd apps/api
npx prisma migrate deploy

# Seed initial data (creates Super Admin)
npm run db:seed
```

### 2. Build Applications

```bash
# Install dependencies (production only)
npm ci --production=false

# Build API
cd apps/api
npm run build

# Build Storefront
cd ../storefront
npm run build

# Build Admin
cd ../admin
npm run build
```

### 3. API Server Deployment

**Option A: PM2 (Recommended for VPS)**

```bash
# Install PM2 globally
npm install -g pm2

# Start API server
cd apps/api
pm2 start dist/main.js --name luxecraft-api --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

**Option B: Docker**

```dockerfile
# Dockerfile for API (apps/api/Dockerfile)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

```bash
# Build and run
docker build -t luxecraft-api -f apps/api/Dockerfile .
docker run -d --name luxecraft-api -p 3001:3001 --env-file apps/api/.env.production luxecraft-api
```

### 4. Storefront Deployment

**Option A: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy storefront
cd apps/storefront
vercel --prod
```

**Option B: PM2**

```bash
cd apps/storefront
pm2 start npm --name luxecraft-storefront -- start
pm2 save
```

**Option C: Docker**

```dockerfile
# Dockerfile for Storefront (apps/storefront/Dockerfile)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
```

### 5. Admin Deployment

Same options as Storefront (Vercel/PM2/Docker).

```bash
cd apps/admin
vercel --prod
# OR
pm2 start npm --name luxecraft-admin -- start
# OR
docker build -t luxecraft-admin -f apps/admin/Dockerfile .
```

### 6. Nginx Configuration

```nginx
# /etc/nginx/sites-available/luxecraft

# API Server
server {
    listen 443 ssl http2;
    server_name api.luxecraft.com;

    ssl_certificate /etc/ssl/certs/luxecraft.crt;
    ssl_certificate_key /etc/ssl/private/luxecraft.key;

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

# Storefront (if self-hosted)
server {
    listen 443 ssl http2;
    server_name luxecraft.com www.luxecraft.com;

    ssl_certificate /etc/ssl/certs/luxecraft.crt;
    ssl_certificate_key /etc/ssl/private/luxecraft.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin (if self-hosted)
server {
    listen 443 ssl http2;
    server_name admin.luxecraft.com;

    ssl_certificate /etc/ssl/certs/luxecraft.crt;
    ssl_certificate_key /etc/ssl/private/luxecraft.key;

    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name luxecraft.com www.luxecraft.com api.luxecraft.com admin.luxecraft.com;
    return 301 https://$host$request_uri;
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/luxecraft /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificates

**Using Let's Encrypt (Free):**

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d luxecraft.com -d www.luxecraft.com
sudo certbot --nginx -d api.luxecraft.com
sudo certbot --nginx -d admin.luxecraft.com

# Auto-renewal is configured automatically
sudo certbot renew --dry-run
```

### 8. Database Backups

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Add to crontab for daily backups at 2 AM
crontab -e
# Add this line:
0 2 * * * /path/to/luxecraft/scripts/backup-db.sh
```

Backup script is already created at `scripts/backup-db.sh`.

### 9. Monitoring & Health Checks

**Health Check Endpoints:**
- API: `GET https://api.luxecraft.com/api/v1/health`
- API Ping: `GET https://api.luxecraft.com/api/v1/health/ping`

**Setup monitoring (optional):**
```bash
# Install monitoring tool
npm install -g pm2-logrotate

# Configure log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# View logs
pm2 logs luxecraft-api
pm2 logs luxecraft-storefront
pm2 logs luxecraft-admin
```

---

## Verification Checklist

After deployment, verify:

### API Server
- [ ] `GET /api/v1/health` returns 200 OK
- [ ] `GET /api/v1/health/ping` returns 200 OK
- [ ] Database connection working
- [ ] Redis connection working
- [ ] CORS configured for storefront/admin domains
- [ ] Rate limiting active

### Storefront
- [ ] Homepage loads with products
- [ ] Product listing works
- [ ] Product detail pages load
- [ ] Cart functionality works
- [ ] Authentication flow works
- [ ] Checkout flow functional
- [ ] SSL certificate valid

### Admin
- [ ] Admin login works
- [ ] Dashboard displays stats
- [ ] Product management works
- [ ] Order management works
- [ ] SSL certificate valid

### Database
- [ ] Migrations applied successfully
- [ ] Super Admin account created
- [ ] Initial categories seeded (if any)
- [ ] Backup cron job configured

### Security
- [ ] All HTTP redirects to HTTPS
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Security headers configured (Helmet)
- [ ] JWT secrets are strong and unique

---

## Post-Deployment Tasks

### 1. Create Initial Content

```bash
# Login as Super Admin
# Create categories via Admin UI
# Upload products with images
# Configure shipping zones and methods
# Set up tax rules
```

### 2. Payment Gateway Integration

Configure your payment provider (Stripe/PayPal/Razorpay):
- Add API keys to environment variables
- Test payment flow in production
- Verify webhook endpoints

### 3. Email Provider Integration

Configure transactional email provider:
- Add SMTP/API credentials
- Test email delivery (registration, password reset)
- Configure email templates

### 4. Object Storage

Configure image storage (S3/DigitalOcean Spaces/Cloudinary):
- Add credentials to environment
- Test image upload
- Configure CDN if needed

---

## Rollback Procedure

If deployment fails:

```bash
# Stop services
pm2 stop luxecraft-api luxecraft-storefront luxecraft-admin

# Restore database from backup
psql -h your-db-host -U luxecraft_user luxecraft_prod < backups/backup-YYYY-MM-DD.sql

# Revert to previous git commit
git checkout <previous-commit-hash>

# Rebuild and restart
npm run build
pm2 restart all
```

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor health check endpoints
- Check error logs
- Verify backup completion

**Weekly:**
- Review analytics and performance
- Check disk space usage
- Update dependencies (security patches)

**Monthly:**
- Review and rotate logs
- Database optimization (VACUUM, ANALYZE)
- Security audit

### Logs Location

```bash
# PM2 logs
~/.pm2/logs/

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# Application logs (if configured)
/var/log/luxecraft/
```

---

## Troubleshooting

### API Server Issues

**Database connection fails:**
```bash
# Check database is running
sudo systemctl status postgresql

# Test connection
psql -h your-db-host -U luxecraft_user luxecraft_prod

# Check DATABASE_URL in .env
```

**Redis connection fails:**
```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli -h your-redis-host ping
```

### Next.js Build Issues

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Port already in use:**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Nginx Issues

**502 Bad Gateway:**
```bash
# Check backend service is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Scaling Considerations

### Horizontal Scaling

**API Server:**
- Run multiple instances behind load balancer
- Use Redis for session storage (already configured)
- Enable database connection pooling

**Storefront/Admin:**
- Deploy to edge network (Vercel/Netlify)
- Use CDN for static assets
- Enable Next.js caching

### Database Scaling

- Enable read replicas
- Implement connection pooling
- Add database indexes for frequently queried fields
- Consider PostgreSQL partitioning for large tables

### Caching Strategy

- Enable Redis caching for product catalog
- Use CDN for images and static assets
- Implement HTTP caching headers
- Consider full-page caching for storefront

---

## Security Hardening

### Additional Security Measures

1. **Firewall Configuration:**
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

2. **Database Security:**
- Use strong passwords
- Restrict database access to application server only
- Enable SSL for database connections
- Regular security updates

3. **Application Security:**
- Keep dependencies updated
- Enable audit logging for admin actions
- Implement rate limiting per user
- Monitor for suspicious activity

4. **SSL/TLS:**
- Use TLS 1.3
- Enable HSTS headers
- Configure strong cipher suites
- Implement certificate pinning (optional)

---

## Production Environment Variables Summary

Required environment variables for production deployment:

**Critical (Must Configure):**
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` — Redis connection
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — Customer JWT secrets
- `ADMIN_JWT_SECRET`, `ADMIN_JWT_REFRESH_SECRET` — Admin JWT secrets
- `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` — Initial admin account
- `CORS_ORIGINS` — Allowed frontend domains

**Optional (Configure as needed):**
- Email provider credentials
- Payment gateway API keys
- Object storage credentials
- Analytics tracking IDs
- Monitoring service tokens

---

## Deployment Checklist

- [ ] Database created and configured
- [ ] Redis instance running
- [ ] Environment variables configured
- [ ] Prisma migrations applied
- [ ] Super Admin account created
- [ ] API server deployed and running
- [ ] Storefront deployed and accessible
- [ ] Admin panel deployed and accessible
- [ ] Nginx configured with SSL
- [ ] Domain DNS configured
- [ ] Health checks passing
- [ ] Backups configured
- [ ] Monitoring setup
- [ ] Security measures implemented
- [ ] Initial content created
- [ ] Payment gateway tested
- [ ] Email delivery tested

---

**Deployment Complete! 🚀**

Your LuxeCraft ecommerce platform is now live in production.

For support or issues, refer to the troubleshooting section or check application logs.
