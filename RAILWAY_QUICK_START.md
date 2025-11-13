# Railway Quick Start - Everything in One Place

## 🎯 Your Goal
Deploy everything on Railway so people can sign up and use Exprora for free.

---

## 📋 Pre-Flight Checklist

Before starting:
- [ ] Your code is pushed to GitHub
- [ ] You have exprora.com domain
- [ ] Railway account ready

---

## 🚀 10 Steps to Live

### Step 1: Railway Project (2 min)
1. [railway.app](https://railway.app) → Sign up with GitHub
2. "New Project" → "Deploy from GitHub repo"
3. Select exprora repository

### Step 2: PostgreSQL Database (2 min)
1. In project → "New" → "Database" → "Add PostgreSQL"
2. Click database → "Variables" → Copy `DATABASE_URL`

### Step 3: Database Migrations (3 min)
1. Click PostgreSQL service
2. "Connect" → "Query" (or use any PostgreSQL client)
3. Run `database/schema.sql` (copy/paste entire file)
4. Run `database/schema_additions.sql` (copy/paste entire file)

### Step 4: Backend Service (5 min)
1. Project → "New" → "GitHub Repo" → Your repo
2. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. "Variables" → Add:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-secret-here
   ADMIN_JWT_SECRET=your-secret-here
   FRONTEND_URL=https://exprora.com
   NODE_ENV=production
   PORT=3001
   RAILWAY_PUBLIC_DOMAIN=${{Railway.PublicDomain}}
   ```
4. Generate secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run twice, copy outputs
5. Wait for deploy → Copy backend URL

### Step 5: Frontend Service (5 min)
1. Project → "New" → "GitHub Repo" → Your repo
2. Configure:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
3. "Variables" → Add:
   ```
   NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
   ```
4. Wait for deploy → Copy frontend URL

### Step 6: Connect Domain (5 min)
1. Frontend service → "Settings" → "Networking"
2. "Custom Domain" → Add:
   - `exprora.com`
   - `www.exprora.com`
3. Railway shows DNS instructions
4. Go to domain registrar → Add CNAME record
5. Wait 5-10 minutes → SSL auto-generates

### Step 7: Create Admin Account (3 min)

**Install Railway CLI:**
```bash
npm i -g @railway/cli
```

**Create admin:**
```bash
railway login
railway link  # Select your project
railway run npx tsx backend/create-admin-simple.ts
```

Should output:
```
✅ Admin account created successfully!
Email: shubhambaliyan360@gmail.com
```

### Step 8: Build SDK (2 min)

**On your local machine:**
```bash
cd sdk
npm install
npm run build
```

This automatically:
- Compiles TypeScript
- Creates browser-compatible bundle
- Copies to `backend/public/sdk.js`

**Commit and push:**
```bash
git add backend/public/sdk.js
git commit -m "Add SDK file"
git push
```

Railway will auto-redeploy backend with SDK file.

### Step 9: Verify SDK is Accessible (1 min)
1. Visit: `https://your-backend-url.railway.app/sdk.js`
2. Should see JavaScript code (not 404)
3. If 404, check `backend/public/sdk.js` exists

### Step 10: Test Everything (5 min)

**Test Homepage:**
- Visit `https://exprora.com` → Should see marketing page

**Test Signup:**
- Click "Get Started" → Create account → Should work

**Test Client Login:**
- Login with test account → Should see dashboard
- Click "Get Embed Code" → Should show code

**Test Admin Login:**
- Go to `/login`
- Email: `shubhambaliyan360@gmail.com`
- Password: `exproramain`
- Should see admin dashboard (different from client)

**Test Embed Code:**
- Copy embed code
- Add to a test HTML page
- Open in browser → Check console for SDK loading
- Should see: "Exprora SDK initialization..."

---

## ✅ Success Checklist

- [ ] Railway project created
- [ ] Database added and migrations run
- [ ] Backend deployed and running
- [ ] Frontend deployed and running
- [ ] Domain connected (exprora.com)
- [ ] Admin account created
- [ ] SDK file built and accessible
- [ ] Test signup works
- [ ] Test login works (client & admin)
- [ ] Embed code generates correctly

---

## 🎯 Your Railway Project

You'll see in Railway dashboard:
```
Exprora Project
├── PostgreSQL (Database)
│   └── Variables: DATABASE_URL
├── Backend (Node.js)
│   └── Variables: JWT_SECRET, ADMIN_JWT_SECRET, etc.
└── Frontend (Next.js)
    └── Variables: NEXT_PUBLIC_API_URL
```

**Everything in one place!** 🚂

---

## 💰 Cost

- **Free tier:** $5 credit/month (enough to start)
- **Hobby:** $5/month (when you grow)
- **Total:** $0-5/month

---

## 🆘 Troubleshooting

### Backend won't start:
- Check "Deployments" → "View Logs"
- Verify DATABASE_URL is correct
- Check JWT_SECRET is set

### Frontend build fails:
- Check NEXT_PUBLIC_API_URL is set
- Check build logs in Railway

### Database connection error:
- Verify DATABASE_URL format
- Check migrations ran successfully
- Ensure database service is running

### SDK 404:
- Verify `backend/public/sdk.js` exists
- Check file was committed and pushed
- Wait for Railway to redeploy

### Domain not working:
- Wait 10-15 minutes for DNS
- Check DNS records are correct
- Verify SSL certificate generated

---

## 🎉 You're Live!

People can now:
1. Visit exprora.com
2. Sign up for free
3. Get their embed code
4. Add it to their website
5. Start creating A/B tests

**You can:**
1. Login as admin
2. See all users
3. Manage the platform

---

## 📝 Next Steps

1. Test with real website
2. Create your first experiment
3. Share with beta users
4. Collect feedback
5. Iterate and improve

**Total time: ~30 minutes** ⏱️

**Everything is on Railway - one platform, one dashboard!** 🚂

