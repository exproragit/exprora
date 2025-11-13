# Organization Setup Guide - Exprora

Complete guide to set up and run Exprora as a production organization.

## 🎯 Overview

This guide covers everything you need to:
1. Deploy the platform to production
2. Set up your domain (exprora.com)
3. Configure infrastructure
4. Create your admin account
5. Launch and operate the business

---

## 📋 Prerequisites Checklist

- [ ] Domain purchased: **exprora.com**
- [ ] Hosting provider account (Vercel, Railway, Render, AWS, etc.)
- [ ] Database provider (PostgreSQL - Supabase, Neon, Railway, AWS RDS)
- [ ] Email service (SendGrid, Mailgun, AWS SES) for password resets
- [ ] Payment processor (Stripe) for subscriptions
- [ ] SSL certificate (usually automatic with modern hosting)

---

## 🚀 Step 1: Database Setup

### Option A: Supabase (Recommended - Free tier available)
1. Go to [supabase.com](https://supabase.com)
2. Create account → New Project
3. Note your connection string (Settings → Database → Connection string)
4. Run migrations:
   ```bash
   # Connect to your Supabase database
   psql "your-connection-string"
   
   # Run schema files
   \i database/schema.sql
   \i database/schema_additions.sql
   ```

### Option B: Neon (Serverless PostgreSQL)
1. Go to [neon.tech](https://neon.tech)
2. Create project
3. Get connection string
4. Run migrations same as above

### Option C: Railway/Render (All-in-one)
- They provide PostgreSQL automatically
- Get connection string from dashboard

---

## 🖥️ Step 2: Backend Deployment

### Option A: Railway (Easiest)
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Connect your repository
4. Add environment variables:
   ```
   DATABASE_URL=your-postgres-connection-string
   JWT_SECRET=generate-strong-secret-32-chars-min
   ADMIN_JWT_SECRET=generate-different-strong-secret-32-chars-min
   PORT=3001
   FRONTEND_URL=https://exprora.com
   NODE_ENV=production
   API_URL=https://api.exprora.com (or your backend URL)
   ```
5. Railway auto-deploys on git push

### Option B: Render
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Build command: `cd backend && npm install && npm run build`
5. Start command: `cd backend && npm start`
6. Add environment variables (same as above)

### Option C: AWS/Google Cloud/Azure
- Use Elastic Beanstalk, Cloud Run, or App Service
- More complex but more control

**Backend URL will be:** `https://api.exprora.com` or `https://backend.exprora.com`

---

## 🌐 Step 3: Frontend Deployment

### Option A: Vercel (Recommended - Free tier)
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Root directory: `frontend`
4. Framework: Next.js
5. Add environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.exprora.com
   ```
6. Deploy → Your site is live!

### Option B: Netlify
1. Go to [netlify.com](https://netlify.com)
2. New site from Git
3. Build command: `cd frontend && npm run build`
4. Publish directory: `frontend/.next`
5. Add environment variable: `NEXT_PUBLIC_API_URL`

**Frontend URL will be:** `https://exprora.com`

---

## 🔗 Step 4: Domain Configuration

### Connect exprora.com to Vercel/Netlify:
1. In Vercel/Netlify dashboard → Domain settings
2. Add domain: `exprora.com` and `www.exprora.com`
3. Follow DNS instructions:
   - Add A record or CNAME as instructed
   - Update nameservers if needed
4. SSL certificate auto-generated (Let's Encrypt)

### Connect API subdomain:
1. If using separate backend domain: `api.exprora.com`
2. Add CNAME record pointing to your backend host
3. Or use same domain with path: `exprora.com/api`

---

## 🔐 Step 5: Create Your Admin Account

### After database is set up:

```bash
# SSH into your backend server or run locally with production DB
cd backend
npx tsx src/scripts/create-admin.ts
```

Enter:
- **Email:** your-email@exprora.com (or your personal email)
- **Name:** Your Name
- **Password:** Strong password (save it securely!)

**Save these credentials!** This is your owner/admin account.

---

## ⚙️ Step 6: Environment Variables Setup

### Backend (.env or hosting platform):
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-very-long-random-secret-at-least-32-characters
ADMIN_JWT_SECRET=different-very-long-random-secret-at-least-32-characters

# Server
PORT=3001
NODE_ENV=production

# URLs
FRONTEND_URL=https://exprora.com
API_URL=https://api.exprora.com

# Optional: Email (for password resets)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
SMTP_FROM=noreply@exprora.com

# Optional: Stripe (for payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Frontend (Vercel/Netlify):
```env
NEXT_PUBLIC_API_URL=https://api.exprora.com
```

---

## 🔑 Step 7: Generate Secure Secrets

```bash
# Generate JWT secrets (run these commands)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the output for `JWT_SECRET` and `ADMIN_JWT_SECRET`.

---

## 📧 Step 8: Email Service Setup (Optional but Recommended)

### SendGrid (Free tier: 100 emails/day)
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key
3. Verify sender email
4. Add to backend environment variables

### Update email service in backend:
- File: `backend/src/services/email.ts` (may need to be created)
- Implement password reset emails
- Implement welcome emails

---

## 💳 Step 8: Stripe Setup (For Payments)

1. Sign up at [stripe.com](https://stripe.com)
2. Get API keys (Test → Live)
3. Set up webhook endpoint: `https://api.exprora.com/api/webhooks/stripe`
4. Add webhook secret to environment
5. Update pricing in database if needed

---

## 🧪 Step 9: Test Everything

### 1. Test Homepage
- Visit `https://exprora.com`
- Should see marketing page

### 2. Test Signup
- Click "Get Started"
- Create a test client account
- Should receive API key

### 3. Test Admin Login
- Go to `/login`
- Login with your admin credentials
- Should see admin dashboard

### 4. Test Client Login
- Login with test client account
- Should see client dashboard
- Get embed code

### 5. Test Embed Code
- Add embed code to a test website
- Check browser console for SDK loading
- Verify events are being tracked

---

## 📊 Step 10: Monitoring & Analytics

### Set up monitoring:
1. **Error Tracking:** Sentry (free tier available)
   - Add to backend and frontend
   - Get alerts on errors

2. **Uptime Monitoring:** UptimeRobot (free)
   - Monitor `https://exprora.com`
   - Monitor `https://api.exprora.com/health`

3. **Analytics:** Google Analytics
   - Track homepage visits
   - Track signups

4. **Logs:** 
   - Railway/Render provide logs
   - Or use Logtail, Datadog

---

## 🔒 Step 11: Security Checklist

- [ ] All environment variables set
- [ ] JWT secrets are strong (32+ characters)
- [ ] Database has strong password
- [ ] SSL/HTTPS enabled (automatic with Vercel/Railway)
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (already in code)
- [ ] Input validation enabled (already in code)
- [ ] Error messages don't leak sensitive info (already fixed)

---

## 📱 Step 12: SDK File Hosting

The embed code references `/sdk.js`. You need to:

### Option A: Host SDK on your backend
1. Build SDK: `cd sdk && npm run build`
2. Serve from backend: `backend/public/sdk.js`
3. Update embed code endpoint to use correct URL

### Option B: Host SDK on CDN
1. Upload `sdk.js` to Cloudflare, AWS S3, or similar
2. Update embed code to use CDN URL

### Option C: Host SDK on same domain
1. Put SDK in `frontend/public/sdk.js`
2. Accessible at `https://exprora.com/sdk.js`

**Update backend route** `backend/src/routes/client.ts` line 275:
```typescript
script.src = 'https://exprora.com/sdk.js'; // or your CDN URL
```

---

## 🚀 Step 13: Launch Checklist

### Pre-Launch:
- [ ] Database migrations run
- [ ] Admin account created
- [ ] Domain connected and SSL working
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and working
- [ ] Test signup works
- [ ] Test login works (admin & client)
- [ ] Embed code generates correctly
- [ ] SDK file accessible
- [ ] Email service configured (optional)
- [ ] Stripe configured (optional)
- [ ] Monitoring set up

### Launch Day:
1. **Test everything one more time**
2. **Create your first test client account** (for demos)
3. **Share with beta users** (if doing beta)
4. **Announce launch** (social media, Product Hunt, etc.)

---

## 📈 Step 14: Post-Launch Operations

### Daily:
- Check error logs (Sentry)
- Monitor uptime
- Check for new signups

### Weekly:
- Review new clients
- Check revenue (if Stripe integrated)
- Review experiment activity

### Monthly:
- Database backups
- Review and optimize costs
- Update dependencies

---

## 💰 Cost Estimates (Monthly)

### Free Tier (Starting):
- **Vercel:** Free (hobby plan)
- **Railway:** Free tier or $5/month
- **Supabase:** Free tier
- **Domain:** $10-15/year
- **Total:** ~$5-10/month

### Growth Tier (100+ clients):
- **Vercel Pro:** $20/month
- **Railway:** $20-50/month
- **Supabase Pro:** $25/month
- **SendGrid:** Free (up to 100 emails/day)
- **Stripe:** 2.9% + $0.30 per transaction
- **Total:** ~$65-95/month + transaction fees

---

## 🛠️ Quick Start Commands

```bash
# 1. Clone and setup
git clone your-repo
cd exprora

# 2. Setup backend
cd backend
npm install
cp .env.example .env
# Edit .env with your values

# 3. Setup frontend
cd ../frontend
npm install
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_API_URL

# 4. Run database migrations
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/schema_additions.sql

# 5. Create admin account
cd backend
npx tsx src/scripts/create-admin.ts

# 6. Test locally
npm run dev  # Backend
cd ../frontend && npm run dev  # Frontend

# 7. Deploy
git push  # Auto-deploys if connected to Railway/Vercel
```

---

## 🎯 Next Steps After Setup

1. **Customize Branding:**
   - Update logo, colors in frontend
   - Update email templates
   - Update pricing if needed

2. **Add Features:**
   - Google OAuth (if needed)
   - Email notifications
   - Advanced analytics
   - API documentation

3. **Marketing:**
   - SEO optimization
   - Content marketing
   - Social media presence
   - Customer testimonials

4. **Support:**
   - Set up support email
   - Create help documentation
   - Add chat widget (Intercom, Crisp)

---

## 🆘 Troubleshooting

### Backend not starting:
- Check environment variables
- Check database connection
- Check logs in hosting dashboard

### Frontend errors:
- Check `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Check browser console for errors

### Database issues:
- Verify connection string
- Check if migrations ran
- Verify database is accessible from hosting

### SDK not loading:
- Check SDK file is accessible
- Check embed code URL is correct
- Check browser console for errors

---

## 📞 Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Railway Docs:** https://docs.railway.app
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## ✅ Final Checklist

Before going live:
- [ ] All steps above completed
- [ ] Tested end-to-end flow
- [ ] Admin account created and tested
- [ ] Test client account created
- [ ] Embed code tested on real website
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Support email ready
- [ ] Terms of Service & Privacy Policy (if needed)

**You're ready to launch! 🚀**

