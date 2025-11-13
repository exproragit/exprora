# Quick Start - Railway (Everything in One Place)

## 🎯 Goal
Get Exprora live on Railway in 30 minutes - backend, frontend, and database all together.

---

## Step 1: Railway Setup (5 min)

1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. New Project → Deploy from GitHub repo
3. Select your exprora repository

---

## Step 2: Add Database (2 min)

1. In Railway project → Click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway creates it automatically
4. Click database → "Variables" tab → Copy `DATABASE_URL`

---

## Step 3: Run Migrations (3 min)

### Using Railway Dashboard:
1. Click PostgreSQL service
2. Click "Connect" → "Postgres URL"
3. Copy connection string
4. Use any PostgreSQL client or Railway's built-in query tool
5. Run:
   - `database/schema.sql`
   - `database/schema_additions.sql`

### Or use Railway CLI:
```bash
npm i -g @railway/cli
railway login
railway link
railway run psql $DATABASE_URL -f database/schema.sql
railway run psql $DATABASE_URL -f database/schema_additions.sql
```

---

## Step 4: Deploy Backend (5 min)

1. Railway project → "New" → "GitHub Repo" → Your repo
2. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. Variables tab → Add:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ADMIN_JWT_SECRET=run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   FRONTEND_URL=https://exprora.com
   NODE_ENV=production
   PORT=3001
   ```
4. Wait for deploy → Copy the URL

---

## Step 5: Deploy Frontend (5 min)

1. Railway project → "New" → "GitHub Repo" → Your repo
2. Settings:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
3. Variables tab → Add:
   ```
   NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```
4. Wait for deploy → Copy the URL

---

## Step 6: Connect Domain (5 min)

1. Frontend service → Settings → Networking
2. Custom Domain → Add `exprora.com` and `www.exprora.com`
3. Add DNS records at your domain registrar
4. Wait 5-10 min for SSL

---

## Step 7: Create Admin (3 min)

```bash
railway link
railway run npx tsx backend/src/scripts/create-admin.ts
```

Enter:
- Email: `shubhambaliyan360@gmail.com`
- Name: `Shubham Baliyan`
- Password: `exproramain`

---

## Step 8: Host SDK (5 min)

1. Build SDK: `cd sdk && npm install && npm run build`
2. Copy to backend: `cp sdk/dist/index.js backend/public/sdk.js`
3. Update embed code in `backend/src/routes/client.ts`:
   ```typescript
   script.src = 'https://your-backend-railway-url.railway.app/sdk.js';
   ```
4. Redeploy backend

---

## Step 9: Test (2 min)

1. Visit `https://exprora.com`
2. Sign up → Create account
3. Login → Get embed code
4. Admin login: `shubhambaliyan360@gmail.com` / `exproramain`

---

## ✅ Done!

Everything is now on Railway:
- ✅ Database
- ✅ Backend
- ✅ Frontend
- ✅ All in one dashboard

**Total time: ~30 minutes**

---

## 💰 Cost

- **Free tier:** $5 credit/month (enough to start)
- **Hobby:** $5/month (when you need more)
- **Total:** $0-5/month to start

---

## 🎯 Your Railway Project Structure

```
Exprora Project (Railway)
├── PostgreSQL Database
├── Backend Service
└── Frontend Service
```

One place, one dashboard, everything together! 🚂

