# Quick Vercel Deployment Guide

Deploy LuxeCraft Storefront and Admin to Vercel in minutes.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository with LuxeCraft code
- API server deployed (see DEPLOYMENT_GUIDE.md)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

## Step 3: Deploy Storefront

```bash
cd apps/storefront
vercel --prod
```

**During deployment, Vercel will ask:**

1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account
3. **Link to existing project?** → No (first time)
4. **Project name?** → `luxecraft-storefront` (or your choice)
5. **Directory?** → `.` (current directory)
6. **Override settings?** → No

**After deployment:**
- Vercel will provide a URL: `https://luxecraft-storefront.vercel.app`
- Configure custom domain in Vercel dashboard (optional)

### Configure Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add these variables:

```
NEXT_PUBLIC_API_URL=https://api.luxecraft.com/api/v1
NEXT_PUBLIC_SITE_URL=https://luxecraft.com
NEXT_PUBLIC_SITE_NAME=LuxeCraft
```

3. Redeploy: `vercel --prod`

## Step 4: Deploy Admin

```bash
cd ../admin
vercel --prod
```

Same process as Storefront.

**Environment Variables for Admin:**
```
NEXT_PUBLIC_API_URL=https://api.luxecraft.com/api/v1
NEXT_PUBLIC_SITE_URL=https://admin.luxecraft.com
NEXT_PUBLIC_SITE_NAME=LuxeCraft Admin
```

## Step 5: Custom Domains (Optional)

### Via Vercel Dashboard:
1. Go to Project Settings → Domains
2. Add your domain (e.g., `luxecraft.com`)
3. Follow Vercel's DNS configuration instructions
4. Vercel automatically provisions SSL certificate

### DNS Configuration:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Step 6: Update API CORS

Update your API server's `CORS_ORIGINS` environment variable:

```env
CORS_ORIGINS=https://luxecraft.com,https://luxecraft-storefront.vercel.app,https://admin.luxecraft.com,https://luxecraft-admin.vercel.app
```

Restart API server:
```bash
pm2 restart luxecraft-api
# OR
docker-compose -f docker-compose.prod.yml restart api
```

## Step 7: Verification

Test your deployment:

**Storefront:**
- ✅ Homepage loads
- ✅ Products display
- ✅ Cart works
- ✅ Authentication works
- ✅ Checkout flow works

**Admin:**
- ✅ Login works
- ✅ Dashboard displays
- ✅ Product management works

## Continuous Deployment

Vercel automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update storefront"
git push origin main
```

Vercel will automatically:
1. Build your project
2. Run tests (if configured)
3. Deploy to production
4. Provide preview URL

## Rollback

If deployment has issues:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Monitoring

View logs in real-time:

```bash
vercel logs luxecraft-storefront --follow
```

Or in Vercel Dashboard → Deployments → View Function Logs

## Cost

**Free Tier includes:**
- Unlimited deployments
- SSL certificates
- 100 GB bandwidth/month
- Automatic CDN
- Analytics

**Upgrade if you need:**
- Custom domains (free on hobby)
- Team collaboration
- More bandwidth
- Advanced analytics

## Troubleshooting

### Build fails

```bash
# Check build logs
vercel logs luxecraft-storefront

# Test build locally
cd apps/storefront
npm run build
```

### Environment variables not working

- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding variables
- Check variable values in Vercel Dashboard

### API connection fails

- Verify `NEXT_PUBLIC_API_URL` is correct
- Check API server CORS configuration
- Test API endpoint: `curl https://api.luxecraft.com/api/v1/health`

## Alternative: Self-Hosted Deployment

If you prefer to self-host Next.js apps:

```bash
# Build
cd apps/storefront
npm run build

# Start with PM2
pm2 start npm --name "luxecraft-storefront" -- start

# Or with Docker (create Dockerfile first)
docker build -t luxecraft-storefront .
docker run -d -p 3000:3000 luxecraft-storefront
```

## Summary

✅ **Storefront deployed to Vercel**
✅ **Admin deployed to Vercel**
✅ **Custom domains configured**
✅ **Environment variables set**
✅ **CORS updated on API**
✅ **SSL automatically enabled**

Your LuxeCraft platform is now live! 🚀

---

**Need help?**
- Vercel Documentation: https://vercel.com/docs
- See full deployment guide: `.ai/DEPLOYMENT_GUIDE.md`
