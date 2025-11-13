# Simple Start Guide - Railway (Everything in One Place)

## 🎯 Goal
Get Exprora live in 30 minutes - everything on Railway.

---

## 📋 What You'll Have

One Railway project with:
- ✅ PostgreSQL Database
- ✅ Backend API
- ✅ Frontend Website
- ✅ All in one dashboard

---

## 🚀 Step-by-Step

### 1. Create Railway Account (2 min)
- Go to [railway.app](https://railway.app)
- Sign up with GitHub
- Authorize Railway

### 2. Create Project (1 min)
- Click "New Project"
- "Deploy from GitHub repo"
- Select your exprora repository

### 3. Add Database (2 min)
- In project → Click "New"
- "Database" → "Add PostgreSQL"
- Railway creates it automatically
- Click database → "Variables" → Copy `DATABASE_URL`

### 4. Run Migrations (3 min)

**Option A: Railway Dashboard**
- Click PostgreSQL service
- "Connect" → "Query" (or use any PostgreSQL client)
- Run `database/schema.sql`
- Run `database/schema_additions.sql`

**Option B: Railway CLI**
```bash
npm i -g @railway/cli
railway login
railway link
railway run psql $DATABASE_URL -f database/schema.sql
railway run psql $DATABASE_URL -f database/schema_additions.sql
```

### 5. Deploy Backend (5 min)

1. In Railway project → "New" → "GitHub Repo" → Your repo
2. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. Go to "Variables" tab → Add these:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=run-command-below
ADMIN_JWT_SECRET=run-command-below
FRONTEND_URL=https://exprora.com
NODE_ENV=production
PORT=3001
```

**Generate secrets** (run locally):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Run twice, use outputs for JWT_SECRET and ADMIN_JWT_SECRET

4. Railway auto-deploys → Wait for "Deploy Succeeded"
5. Click backend service → "Settings" → "Generate Domain" → Copy URL

### 6. Deploy Frontend (5 min)

1. In same Railway project → "New" → "GitHub Repo" → Your repo
2. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. "Variables" tab → Add:

```
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
```

Or manually set to your backend URL: `https://backend-production-xxxx.up.railway.app`

4. Railway auto-deploys → Wait for completion
5. Click frontend service → "Settings" → "Generate Domain" → Copy URL

### 7. Connect Domain (5 min)

1. Click on **Frontend** service
2. "Settings" → "Networking"
3. "Custom Domain" → Add:
   - `exprora.com`
   - `www.exprora.com`
4. Railway shows DNS instructions (usually CNAME record)
5. Go to your domain registrar
6. Add the CNAME record Railway shows
7. Wait 5-10 minutes
8. SSL certificate auto-generates

### 8. Create Admin Account (3 min)

**Using Railway CLI:**
```bash
railway link  # If not already linked
railway run npx tsx backend/create-admin-simple.ts
```

**Or manually:**
```bash
railway run npx tsx backend/src/scripts/create-admin.ts
```
Enter:
- Email: `shubhambaliyan360@gmail.com`
- Name: `Shubham Baliyan`
- Password: `exproramain`

### 9. Build & Host SDK (5 min)

1. **Build SDK:**
   ```bash
   cd sdk
   npm install
   npm run build
   ```

2. **Copy to backend:**
   ```bash
   # Create public folder if it doesn't exist
   mkdir -p backend/public
   
   # Copy SDK file
   cp sdk/dist/index.js backend/public/sdk.js
   ```

3. **Update embed code URL:**
   - File: `backend/src/routes/client.ts` (around line 275)
   - Change to your backend Railway URL:
   ```typescript
   script.src = 'https://your-backend-railway-url.railway.app/sdk.js';
   ```

4. **Commit and push:**
   ```bash
   git add backend/public/sdk.js backend/src/routes/client.ts
   git commit -m "Add SDK file"
   git push
   ```
   Railway will auto-redeploy

### 10. Test Everything (5 min)

1. ✅ Visit `https://exprora.com` → See homepage
2. ✅ Click "Get Started" → Sign up → Create account
3. ✅ Login with test account → See dashboard
4. ✅ Click "Get Embed Code" → Copy code
5. ✅ Admin login:
   - Go to `/login`
   - Email: `shubhambaliyan360@gmail.com`
   - Password: `exproramain`
   - Should see admin dashboard
6. ✅ Test embed code on a website → Check browser console

---

## 🎯 Your Railway Dashboard

You'll see:
```
Exprora Project
├── PostgreSQL (Database)
├── Backend (Node.js service)
└── Frontend (Next.js service)
```

All services, all logs, all in one place!

---

## 💰 Cost

- **Free tier:** $5 credit/month (enough to start)
- **Hobby:** $5/month (when you need more)
- **Total:** $0-5/month

---

## ✅ Checklist

- [ ] Railway account created
- [ ] Project created
- [ ] PostgreSQL database added
- [ ] Migrations run
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Domain connected
- [ ] Admin account created
- [ ] SDK file built and hosted
- [ ] Everything tested

---

## 🆘 If Something Breaks

1. **Check Railway logs:**
   - Click any service → "Deployments" → "View Logs"

2. **Common issues:**
   - Database connection: Check DATABASE_URL
   - Build fails: Check build command
   - Frontend can't reach backend: Check NEXT_PUBLIC_API_URL

3. **Redeploy:**
   - Railway auto-redeploys on git push
   - Or manually: Service → "Deploy" → "Redeploy"

---

## 🎉 You're Done!

Everything is now on Railway:
- Database ✅
- Backend ✅
- Frontend ✅
- Domain ✅
- Admin account ✅

**People can now sign up and use Exprora for free!** 🚀

---

## 📝 Next Steps

1. Test with real website
2. Create your first experiment
3. Share with beta users
4. Collect feedback
5. Scale as you grow

**Total time: ~30 minutes** ⏱️

