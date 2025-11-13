# Quick Deploy Guide - 15 Minutes

Fastest way to get Exprora live.

## 🚀 Fastest Path (Railway + Vercel)

### 1. Database (5 min)
1. Go to [supabase.com](https://supabase.com) → Sign up
2. New Project → Wait for setup
3. Settings → Database → Copy connection string
4. SQL Editor → Run `database/schema.sql` → Run `database/schema_additions.sql`

### 2. Backend (5 min)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Deploy from GitHub repo
3. Select your repo → Add service
4. Root directory: `backend`
5. Add environment variables:
   ```
   DATABASE_URL=your-supabase-connection-string
   JWT_SECRET=run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ADMIN_JWT_SECRET=run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   FRONTEND_URL=https://exprora.com
   NODE_ENV=production
   ```
6. Deploy → Copy the URL (e.g., `https://your-app.railway.app`)

### 3. Frontend (3 min)
1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub
2. Import Project → Select repo
3. Root directory: `frontend`
4. Framework: Next.js
5. Environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app
   ```
6. Deploy

### 4. Domain (2 min)
1. In Vercel → Settings → Domains
2. Add `exprora.com`
3. Follow DNS instructions (add CNAME/A records)
4. Wait for SSL (automatic, ~5 min)

### 5. Create Admin (1 min)
```bash
# On your local machine, connect to production DB
cd backend
DATABASE_URL=your-supabase-connection-string npx tsx src/scripts/create-admin.ts
```

### 6. Update Backend URL
1. In Railway → Settings → Generate Domain
2. Copy the domain
3. Update Vercel env: `NEXT_PUBLIC_API_URL=https://your-railway-domain.railway.app`
4. Redeploy frontend

**Done! Visit https://exprora.com** 🎉

---

## 🔧 Post-Deploy Tasks

1. **Test signup** - Create a test account
2. **Test admin login** - Login with your admin credentials
3. **Get embed code** - From client dashboard
4. **Test SDK** - Add embed code to a test page

---

## 💡 Pro Tips

- Use Railway's free tier for testing
- Vercel free tier is generous
- Supabase free tier: 500MB database
- Total cost: **$0/month** to start!

---

## 🆘 If Something Breaks

1. Check Railway logs (Deployments → View logs)
2. Check Vercel logs (Deployments → View logs)
3. Check browser console for errors
4. Verify environment variables are set
5. Verify database connection works

---

**Time to live: ~15 minutes!** ⚡

