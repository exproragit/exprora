# Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb exprora

# Run schema
psql exprora < database/schema.sql

# Create admin user
cd backend
npx tsx src/scripts/create-admin.ts
```

### 2. Backend Deployment

**Option A: Heroku**
```bash
cd backend
heroku create exprora-api
heroku addons:create heroku-postgresql:hobby-dev
heroku config:set JWT_SECRET=your-secret
heroku config:set ADMIN_JWT_SECRET=your-admin-secret
heroku config:set STRIPE_SECRET_KEY=your-stripe-key
heroku config:set STRIPE_WEBHOOK_SECRET=your-webhook-secret
git push heroku main
```

**Option B: AWS/DigitalOcean**
- Set up Node.js server
- Install PostgreSQL
- Configure environment variables
- Run `npm run build && npm start`

### 3. Frontend Deployment

**Option A: Vercel (Recommended)**
```bash
cd frontend
vercel
# Set environment variable:
# NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

**Option B: Netlify**
```bash
cd frontend
npm run build
# Deploy dist folder
# Set environment variable: NEXT_PUBLIC_API_URL
```

### 4. SDK Deployment

**Option A: CDN (Recommended)**
- Build SDK: `cd sdk && npm run build`
- Upload `dist/index.js` to CDN (Cloudflare, AWS CloudFront)
- Update SDK URL in client integration guide

**Option B: NPM Package**
```bash
cd sdk
npm publish
```

### 5. Stripe Webhook Setup

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-backend-url.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook secret to backend `.env`

### 6. Domain Configuration

1. Point your domain to frontend (Vercel/Netlify)
2. Update `FRONTEND_URL` in backend `.env`
3. Update `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### 7. Environment Variables Checklist

**Backend (.env):**
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] ADMIN_JWT_SECRET
- [ ] STRIPE_SECRET_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] FRONTEND_URL
- [ ] PORT

**Frontend (.env.local):**
- [ ] NEXT_PUBLIC_API_URL

---

## ✅ Post-Deployment Checklist

- [ ] Test admin login
- [ ] Test client signup
- [ ] Test experiment creation
- [ ] Test SDK integration
- [ ] Test Stripe webhook
- [ ] Test payment flow
- [ ] Set up monitoring
- [ ] Set up backups
- [ ] Configure SSL
- [ ] Set up error tracking

---

## 🔧 Maintenance

### Database Backups
```bash
pg_dump exprora > backup.sql
```

### Logs
- Backend: Check server logs
- Frontend: Check Vercel/Netlify logs
- Stripe: Check webhook logs

### Updates
1. Pull latest code
2. Run migrations (if any)
3. Rebuild and redeploy
4. Test thoroughly

---

## 🆘 Troubleshooting

**Database connection errors:**
- Check DATABASE_URL
- Verify PostgreSQL is running
- Check firewall rules

**Stripe webhook not working:**
- Verify webhook URL is correct
- Check webhook secret matches
- Review Stripe webhook logs

**SDK not loading:**
- Verify CDN URL is correct
- Check CORS settings
- Verify API key is valid

---

## 📞 Support

For issues, check:
1. Server logs
2. Database logs
3. Stripe dashboard
4. Browser console (for frontend)

