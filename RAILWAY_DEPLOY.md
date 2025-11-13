# Railway Deployment - Everything in One Place

Complete guide to deploy Exprora on Railway (backend, frontend, database all together).

---

## 🚀 Step-by-Step: Railway Deployment

### Step 1: Create Railway Account (2 minutes)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Authorize Railway to access your repos

---

### Step 2: Create New Project (1 minute)

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your exprora repository
4. Railway will detect it

---

### Step 3: Add PostgreSQL Database (2 minutes)

1. In your Railway project → Click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway creates a PostgreSQL database automatically
4. Click on the database service
5. Go to "Variables" tab
6. Copy the `DATABASE_URL` (you'll need it)

---

### Step 4: Run Database Migrations (5 minutes)

#### Option A: Using Railway CLI (Recommended)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to your project:
   ```bash
   railway link
   ```

4. Run migrations:
   ```bash
   railway run psql $DATABASE_URL -f database/schema.sql
   railway run psql $DATABASE_URL -f database/schema_additions.sql
   ```

#### Option B: Using Railway's Database Dashboard

1. Click on your PostgreSQL service
2. Click "Connect" → "Postgres URL"
3. Copy the connection string
4. Use any PostgreSQL client (pgAdmin, DBeaver, or online tool)
5. Connect and run the SQL files:
   - `database/schema.sql`
   - `database/schema_additions.sql`

---

### Step 5: Deploy Backend (5 minutes)

1. In Railway project → Click "New"
2. Select "GitHub Repo" → Your exprora repo
3. Railway will ask for settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Watch Paths:** `backend/**`

4. Go to "Variables" tab → Add these:

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=generate-this-below
ADMIN_JWT_SECRET=generate-this-below
FRONTEND_URL=https://exprora.com
NODE_ENV=production
PORT=3001
```

5. Generate secrets (run locally):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run twice, use outputs for JWT_SECRET and ADMIN_JWT_SECRET

6. Railway will auto-deploy → Wait for "Deploy Succeeded"

7. Click "Settings" → "Generate Domain" → Copy the URL (e.g., `https://backend-production-xxxx.up.railway.app`)

---

### Step 6: Deploy Frontend (5 minutes)

1. In same Railway project → Click "New"
2. Select "GitHub Repo" → Your exprora repo (again)
3. Settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Watch Paths:** `frontend/**`

4. Go to "Variables" tab → Add:

```
NEXT_PUBLIC_API_URL=${{Backend.RAILWAY_PUBLIC_DOMAIN}}
# Or use the backend URL you copied: https://backend-production-xxxx.up.railway.app
```

5. Railway will auto-deploy → Wait for completion

6. Click "Settings" → "Generate Domain" → Copy the URL

---

### Step 7: Connect Your Domain (10 minutes)

1. In Railway project → Click on your **Frontend** service
2. Go to "Settings" → "Networking"
3. Click "Custom Domain"
4. Add: `exprora.com`
5. Add: `www.exprora.com`
6. Railway will show DNS instructions:
   - Usually a CNAME record pointing to Railway's domain
7. Go to your domain registrar (where you bought exprora.com)
8. Add the CNAME records Railway shows
9. Wait 5-10 minutes for DNS propagation
10. SSL certificate auto-generates (Railway uses Let's Encrypt)

---

### Step 8: Update Frontend API URL (2 minutes)

1. In Railway → Frontend service → Variables
2. Update `NEXT_PUBLIC_API_URL` to your backend Railway domain:
   ```
   NEXT_PUBLIC_API_URL=https://backend-production-xxxx.up.railway.app
   ```
3. Railway will auto-redeploy

---

### Step 9: Create Your Admin Account (5 minutes)

#### Using Railway CLI:

```bash
# Make sure you're linked to the project
railway link

# Run the admin creation script
railway run npx tsx src/scripts/create-admin.ts
```

Enter:
- Email: `shubhambaliyan360@gmail.com`
- Name: `Shubham Baliyan`
- Password: `exproramain`

#### Or create a quick script:

Create `backend/create-admin-railway.ts`:
```typescript
import bcrypt from 'bcryptjs';
import pool from './src/database/connection';

async function createAdmin() {
  const email = 'shubhambaliyan360@gmail.com';
  const password = 'exproramain';
  const name = 'Shubham Baliyan';

  const passwordHash = await bcrypt.hash(password, 10);
  
  await pool.query(
    `INSERT INTO admin_users (email, password_hash, name, role)
     VALUES ($1, $2, $3, 'super_admin')
     ON CONFLICT (email) DO NOTHING`,
    [email, passwordHash, name]
  );
  
  console.log('✅ Admin created!');
  process.exit(0);
}

createAdmin();
```

Then run:
```bash
railway run npx tsx backend/create-admin-railway.ts
```

---

### Step 10: Host SDK File (5 minutes)

#### Option A: Serve from Backend (Easiest)

1. Build SDK:
   ```bash
   cd sdk
   npm install
   npm run build
   ```

2. Copy built file to backend:
   ```bash
   cp sdk/dist/index.js backend/public/sdk.js
   ```

3. Update backend to serve it:
   - In `backend/src/index.ts`, add:
   ```typescript
   app.use(express.static('public'));
   ```

4. Update embed code URL in `backend/src/routes/client.ts`:
   ```typescript
   script.src = 'https://your-backend-railway-url.railway.app/sdk.js';
   ```

5. Redeploy backend

#### Option B: Serve from Frontend

1. Build SDK
2. Copy to `frontend/public/sdk.js`
3. Update embed code to: `https://exprora.com/sdk.js`
4. Redeploy frontend

---

### Step 11: Test Everything (5 minutes)

1. Visit `https://exprora.com` → Should see homepage
2. Click "Get Started" → Create test account
3. Login with test account → See dashboard
4. Get embed code → Copy it
5. Admin login:
   - Go to `/login`
   - Email: `shubhambaliyan360@gmail.com`
   - Password: `exproramain`
   - Should see admin dashboard
6. Test embed code on a website

---

## 📊 Railway Project Structure

Your Railway project will have:
```
Exprora Project
├── PostgreSQL (Database)
├── Backend Service (Node.js)
└── Frontend Service (Next.js)
```

All in one place, one dashboard!

---

## 💰 Railway Pricing

### Free Tier:
- $5 free credit/month
- Enough for starting small
- PostgreSQL included
- Auto-scaling

### Hobby Plan ($5/month):
- More resources
- Better performance
- Still very affordable

### Pro Plan ($20/month):
- Even more resources
- Better for growth

**Start with free tier, upgrade when needed!**

---

## 🔧 Railway Advantages

✅ Everything in one place
✅ Auto-deploys on git push
✅ Built-in PostgreSQL
✅ Free SSL certificates
✅ Easy environment variables
✅ Simple domain setup
✅ One dashboard for everything
✅ Auto-scaling
✅ Great for starting small

---

## 🚨 Troubleshooting

### Backend won't start:
- Check logs in Railway dashboard
- Verify DATABASE_URL is set
- Check build command is correct

### Frontend won't build:
- Check NEXT_PUBLIC_API_URL is set
- Verify build command
- Check logs for errors

### Database connection fails:
- Verify DATABASE_URL format
- Check if migrations ran
- Ensure database service is running

### Domain not working:
- Wait 10-15 minutes for DNS
- Check DNS records are correct
- Verify SSL certificate generated

---

## ✅ Final Checklist

- [ ] Railway account created
- [ ] Project created
- [ ] PostgreSQL database added
- [ ] Migrations run
- [ ] Backend deployed
- [ ] Frontend deployed
- [ ] Domain connected
- [ ] Admin account created
- [ ] SDK file hosted
- [ ] Everything tested

---

**Everything in one place on Railway!** 🚂

