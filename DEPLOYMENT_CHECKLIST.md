# Deployment Checklist

## Pre-Deployment Review

### Code Quality
- [ ] All TypeScript compiles without errors
  ```bash
  npm run build
  ```
- [ ] No console.log() for sensitive data
- [ ] All error handling in place
- [ ] Input validation on all endpoints
- [ ] Comments on complex logic
- [ ] No hardcoded values

### Security
- [ ] Strong JWT_SECRET generated
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] All environment variables configured
- [ ] No .env file in git repository
- [ ] No credentials in code
- [ ] HTTPS/SSL enabled
- [ ] CORS configured for production domain
- [ ] Rate limiting considered
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS prevention in email templates

### Database
- [ ] PostgreSQL version ≥ 12
- [ ] Database backup plan in place
- [ ] All migrations tested
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Database indices verified
- [ ] Connection pooling configured
- [ ] SSL certificate for database connection
- [ ] Read replicas considered for scaling

### Email Service
- [ ] Email account created
- [ ] App-specific password generated (Gmail)
- [ ] SMTP credentials verified
- [ ] Email templates tested
- [ ] Email queue system considered (optional)
- [ ] Bounce handling configured
- [ ] Email limits checked

### Google OAuth
- [ ] OAuth app registered at Google Cloud
- [ ] Client ID and Secret obtained
- [ ] Redirect URI registered
- [ ] Scopes set to minimum needed (profile, email)
- [ ] Consent screen configured
- [ ] Privacy policy linked

### Performance
- [ ] Database queries optimized
  ```bash
  npx prisma studio
  ```
- [ ] N+1 query problems eliminated
- [ ] Caching strategy implemented
- [ ] Load tested
- [ ] Response times < 1 second verified
- [ ] Email sending async
- [ ] Database indices active

### Monitoring & Logging
- [ ] Error tracking service integrated (Sentry, etc.)
- [ ] Application logs configured
- [ ] Database logs enabled
- [ ] Email service logs monitored
- [ ] Uptime monitoring setup
- [ ] Alert thresholds configured
- [ ] Log retention policy set

## Deployment Steps

### 1. Prepare Server
```bash
# SSH into production server
ssh user@production-server

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if needed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Create app directory
mkdir -p /var/www/ceivoice-backend
cd /var/www/ceivoice-backend
```

### 2. Clone Repository
```bash
git clone https://github.com/your-repo/test-ceivoice-backend-database.git .

# Or copy files
scp -r ./src user@server:/var/www/ceivoice-backend/
scp -r ./prisma user@server:/var/www/ceivoice-backend/
scp package.json user@server:/var/www/ceivoice-backend/
```

### 3. Install Dependencies
```bash
npm ci --only=production
# Use --only=production instead of install
```

### 4. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit with production values
nano .env

# Required variables:
# DATABASE_URL=postgresql://prod_user:secure_password@db-host:5432/ceivoice_prod
# JWT_SECRET=very_long_random_secret_key
# EMAIL_SERVICE=gmail
# EMAIL_USER=noreply@company.com
# EMAIL_PASSWORD=app_specific_password
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=https://api.yourdomain.com/api/auth/google/callback
# FRONTEND_URL=https://yourdomain.com
# PORT=5000
# NODE_ENV=production
```

### 5. Build Application
```bash
npm run build

# Verify dist folder created
ls -la dist/
```

### 6. Setup Database
```bash
# Run migrations
npx prisma migrate deploy

# Verify database
npx prisma db execute --stdin < health_check.sql
```

### 7. Setup Process Manager
```bash
# Install PM2
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'ceivoice-backend',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/ceivoice/error.log',
    out_file: '/var/log/ceivoice/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'dist'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Setup startup script
pm2 startup
pm2 save
```

### 8. Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install -y nginx

# Create config
sudo nano /etc/nginx/sites-available/ceivoice-backend

# Content:
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Gzip compression
    gzip on;
    gzip_types text/plain application/json;
    gzip_min_length 1000;

    # Reverse proxy
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/ceivoice-backend /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 9. Setup SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d api.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### 10. Verify Installation
```bash
# Check application is running
pm2 status

# Check logs
pm2 logs ceivoice-backend

# Test endpoint
curl https://api.yourdomain.com/health

# Expected response: {"status":"ok"}
```

### 11. Backup Database
```bash
# Create backup
pg_dump -U postgres ceivoice_prod > backup_$(date +%Y%m%d).sql

# Setup automated backups
sudo nano /etc/cron.daily/ceivoice-backup

# Content:
#!/bin/bash
pg_dump -U postgres ceivoice_prod > /backups/ceivoice_$(date +\%Y\%m\%d).sql
find /backups -name "ceivoice_*.sql" -mtime +7 -delete
```

## Post-Deployment Verification

### Functional Tests
- [ ] Submit request endpoint works
  ```bash
  curl -X POST https://api.yourdomain.com/api/requests \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","message":"test"}'
  ```

- [ ] Track request works
  ```bash
  curl https://api.yourdomain.com/api/requests/track/{tracking_id}
  ```

- [ ] Login works
  ```bash
  curl -X POST https://api.yourdomain.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@company.com","name":"Admin"}'
  ```

- [ ] Admin endpoints work
  ```bash
  curl -H "Authorization: Bearer {token}" \
    https://api.yourdomain.com/api/admin/reports/dashboard
  ```

### Performance Tests
- [ ] Response times < 1 second
- [ ] Database queries optimized
- [ ] Email sends within 60 seconds
- [ ] No memory leaks
  ```bash
  pm2 monit
  ```

### Security Tests
- [ ] HTTPS enforced
- [ ] HTTP → HTTPS redirect works
- [ ] JWT verification working
- [ ] Input validation active
- [ ] CORS configured correctly

### Monitoring Setup
- [ ] Application logs visible
  ```bash
  pm2 logs
  ```

- [ ] Database health good
  ```bash
  psql $DATABASE_URL -c "SELECT version();"
  ```

- [ ] Email service working (check logs)
- [ ] Error tracking operational
- [ ] Alerts configured

## Maintenance Tasks

### Daily
- [ ] Monitor application logs
- [ ] Check error tracking
- [ ] Monitor email queue

### Weekly
- [ ] Database backup
- [ ] Check disk space
- [ ] Review performance metrics

### Monthly
- [ ] Security updates
- [ ] Database optimization
- [ ] Cache cleanup
- [ ] Log rotation

### Quarterly
- [ ] Full load testing
- [ ] Disaster recovery drill
- [ ] Dependency updates
- [ ] Security audit

## Rollback Plan

If deployment fails:

```bash
# Stop current version
pm2 stop ceivoice-backend

# Restore previous version
git revert HEAD
npm ci --only=production
npm run build

# Restore database backup
psql ceivoice_prod < backup_YYYYMMDD.sql

# Start previous version
pm2 start ceivoice-backend

# Check status
curl https://api.yourdomain.com/health
```

## Monitoring & Alerting

### Key Metrics to Monitor
- Error rate
- Response time (p50, p95, p99)
- Database query time
- CPU usage
- Memory usage
- Disk space
- Email success rate

### Alert Thresholds
```
Error rate > 5% → Alert
Response time > 2s → Warning
Memory > 80% → Warning
Disk > 90% → Alert
Database > 2s → Warning
```

## Documentation Links

- [API Documentation](./API_DOCUMENTATION.md)
- [Setup Guide](./SETUP.md)
- [Quick Reference](./QUICK_REFERENCE.md)
- [Testing Guide](./TESTING_GUIDE.md)

## Support

For production issues:
1. Check application logs: `pm2 logs`
2. Check database: `psql $DATABASE_URL`
3. Check error tracking service
4. Review monitoring dashboards
5. Check email service logs

## Checklist Summary

Total: ____ items
Completed: ____ items
Remaining: ____ items

**Status**: ___________________
**Date Deployed**: ___________________
**Deployed By**: ___________________

---

**Note**: This is a comprehensive checklist. Adjust based on your specific infrastructure and requirements.
