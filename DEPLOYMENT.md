# Deployment Guide - Rent-A-Companion

This guide covers deploying the Rent-A-Companion platform to various hosting providers.

## Table of Contents

1. [Vercel Deployment](#vercel-deployment)
2. [Docker Deployment](#docker-deployment)
3. [AWS Deployment](#aws-deployment)
4. [DigitalOcean Deployment](#digitalocean-deployment)
5. [Environment Configuration](#environment-configuration)

## Vercel Deployment (Recommended)

Vercel is the recommended platform for Next.js applications.

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure environment variables (see below)
6. Click "Deploy"

### Environment Variables on Vercel

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
...
```

## Docker Deployment

### Build Docker Image

```bash
# Build the image
docker build -t rent-a-companion .

# Run the container
docker run -p 3000:3000 --env-file .env rent-a-companion
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=${MONGODB_URI}
      - FIREBASE_ADMIN_PRIVATE_KEY=${FIREBASE_ADMIN_PRIVATE_KEY}
      # Add other env vars
    restart: unless-stopped
```

Run:

```bash
docker-compose up -d
```

## AWS Deployment

### Using AWS Elastic Beanstalk

1. Install EB CLI:
```bash
pip install awsebcli
```

2. Initialize EB:
```bash
eb init -p node.js rent-a-companion
```

3. Create environment and deploy:
```bash
eb create rent-a-companion-env
eb open
```

### Using AWS EC2

1. Launch an EC2 instance (Ubuntu 20.04)
2. SSH into the instance
3. Install Node.js and PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

4. Clone and setup:
```bash
git clone https://github.com/yourusername/rent-a-companion.git
cd rent-a-companion
npm install
npm run build
```

5. Create ecosystem file `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'rent-a-companion',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      // Add other env vars
    },
    instances: 'max',
    exec_mode: 'cluster'
  }]
};
```

6. Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## DigitalOcean Deployment

### Using App Platform

1. Push code to GitHub
2. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
3. Click "Create App"
4. Select GitHub repository
5. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
6. Add environment variables
7. Deploy

### Using Droplet

1. Create a Droplet (Ubuntu 20.04)
2. SSH and setup:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Setup app
mkdir -p /var/www/rent-a-companion
cd /var/www/rent-a-companion
git clone https://github.com/yourusername/rent-a-companion.git .
npm install
npm run build
```

3. Configure Nginx:
```bash
sudo nano /etc/nginx/sites-available/rent-a-companion
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

4. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/rent-a-companion /etc/nginx/sites-enabled
sudo nginx -t
sudo systemctl restart nginx
```

5. Setup PM2 (see AWS section)

## Environment Configuration

### Production Environment Variables

```env
# Required
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
MONGODB_URI=mongodb+srv://...
FIREBASE_ADMIN_PRIVATE_KEY=...
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Security
JWT_SECRET=your-secure-secret
CSRF_SECRET=your-csrf-secret

# Optional
PLATFORM_COMMISSION_PERCENTAGE=15
MIN_WITHDRAWAL_AMOUNT=500
```

### SSL/HTTPS Setup

#### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Monitoring

### Using PM2

```bash
# Monitor logs
pm2 logs

# Monitor resources
pm2 monit

# List processes
pm2 list
```

### Using New Relic

1. Sign up for New Relic
2. Install Node.js agent:
```bash
npm install newrelic
```
3. Add `newrelic.js` config
4. Import at top of `server.js`

## Backup Strategy

### MongoDB Backups

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backups/mongodb_$DATE
tar -czf /backups/mongodb_$DATE.tar.gz /backups/mongodb_$DATE
rm -rf /backups/mongodb_$DATE
```

### Automated Backups (Cron)

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh
```

## Troubleshooting

### Common Issues

1. **Build fails on Vercel**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Environment variables not working**
   - Ensure variables are set in deployment platform
   - Prefix client-side variables with `NEXT_PUBLIC_`

3. **MongoDB connection errors**
   - Whitelist deployment server IP
   - Check connection string format

4. **Firebase auth errors**
   - Verify Firebase project configuration
   - Check authorized domains

### Health Check Endpoint

Add to `app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

---

For additional support, contact: support@rentacompanion.com
