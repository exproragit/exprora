# 🚀 Start Here - Get Exprora Live in 30 Minutes

Everything on Railway - one platform, one dashboard.

---

## Quick Steps

### 1. Railway Setup (5 min)
1. Go to [railway.app](https://railway.app) → Sign up with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Select your exprora repository

### 2. Add Database (2 min)
1. In Railway project → "New" → "Database" → "Add PostgreSQL"
2. Click database → "Variables" → Copy `DATABASE_URL`

### 3. Run Migrations (3 min)
- Click PostgreSQL → "Connect" → "Query"
- Copy/paste contents of `database/schema.sql` → Run
- Copy/paste contents of `database/schema_additions.sql` → Run

### 4. Deploy Backend (5 min)
1. Railway project → "New" → "GitHub Repo" → Your repo
2. Settings:
   - Root Directory: `backend`
   - Build: `npm install && npm run build`
   - Start: `npm start`
3. Variables → Add:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=generate-below
   ADMIN_JWT_SECRET=generate-below
   FRONTEND_URL=https://exprora.com
   NODE_ENV=production
   PORT=3001
   ```
4. Generate secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run twice, use for JWT_SECRET and ADMIN_JWT_SECRET
5. Wait for deploy → Copy backend URL

### 5. Deploy Frontend (5 min)
1. Railway project → "New" → "GitHub Repo" → Your repo
2. Settings:
   - Root Directory: `frontend`
   - Build: `npm install && npm run build`
   - Start: `npm start`
3. Variables → Add:
   ```
   NEXT_PUBLIC_API_URL=your-backend-railway-url-here
   ```
4. Wait for deploy → Copy frontend URL

### 6. Connect Domain (5 min)
1. Frontend service → Settings → Networking
2. Custom Domain → Add `exprora.com` and `www.exprora.com`
3. Add DNS records at domain registrar
4. Wait 5-10 min for SSL

### 7. Create Admin (3 min)
```bash
npm i -g @railway/cli
railway login
railway link
railway run npx tsx backend/create-admin-simple.ts
```

### 8. Build SDK (2 min)
```bash
cd sdk
npm install
npm run build
```
This creates `backend/public/sdk.js` automatically.

### 9. Update Embed Code URL (1 min)
- File: `backend/src/routes/client.ts` (line ~275)
- Change to: `script.src = 'https://your-backend-railway-url.railway.app/sdk.js';`
- Commit and push → Railway auto-redeploys

### 10. Test (2 min)
1. Visit `https://exprora.com`
2. Sign up → Create account
3. Login → Get embed code
4. Admin login: `shubhambaliyan360@gmail.com` / `exproramain`

---

## ✅ Done!

Everything is on Railway:
- Database ✅
- Backend ✅  
- Frontend ✅
- All in one place ✅

**People can now sign up and use it for free!** 🎉

---

## 📊 Railway Dashboard

You'll see:
```
Exprora Project
├── PostgreSQL
├── Backend
└── Frontend
```

One dashboard, everything together!

---

## 💰 Cost: $0-5/month (free tier)

---

**Total time: ~30 minutes** ⏱️

