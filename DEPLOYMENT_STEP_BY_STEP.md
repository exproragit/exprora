# 🚀 Railway Deployment - Step by Step Guide

Follow each step carefully. Confirm completion before moving to the next step.

---

## ✅ Pre-Deployment Checklist

Before we start, make sure you have:
- [ ] GitHub account
- [ ] Code pushed to GitHub repository
- [ ] Railway account (we'll create if needed)
- [ ] Domain name (exprora.com) - optional for now

---

## 📋 STEP 1: Push Code to GitHub

**Goal:** Make sure your code is on GitHub so Railway can deploy it.

### Actions:
1. Open terminal in your project folder (`/Users/vaibhavbaliyan/Desktop/exprora`)
2. Check if you have a git repository:
   ```bash
   git status
   ```
3. If not initialized, initialize git:
   ```bash
   git init
   ```
4. Add all files:
   ```bash
   git add .
   ```
5. Commit:
   ```bash
   git commit -m "Initial commit - Ready for Railway deployment"
   ```
6. Create a new repository on GitHub (if you don't have one):
   - Go to https://github.com/new
   - Name it: `exprora` (or any name you prefer)
   - Don't initialize with README
   - Click "Create repository"
7. Connect and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/exprora.git
   git branch -M main
   git push -u origin main
   ```
   (Replace `YOUR_USERNAME` with your GitHub username)

### ✅ Confirmation:
- [ ] Code is pushed to GitHub
- [ ] You can see your files on GitHub.com

**Once confirmed, tell me "Step 1 done" and we'll move to Step 2.**

---

## 📋 STEP 2: Create Railway Account & Project

**Goal:** Set up Railway account and create a new project.

### Actions:
1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended) or email
4. After login, click "New Project"
5. Select "Deploy from GitHub repo"
6. Find and select your `exprora` repository
7. Railway will create a project (this may take a minute)

### ✅ Confirmation:
- [ ] Railway account created
- [ ] Project created and connected to GitHub
- [ ] You can see your project dashboard

**Once confirmed, tell me "Step 2 done" and we'll move to Step 3.**

---

## 📋 STEP 3: Add PostgreSQL Database

**Goal:** Create the database that will store all your data.

### Actions:
1. In your Railway project dashboard, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Wait for database to be created (30-60 seconds)
4. Click on the PostgreSQL service
5. Go to "Variables" tab
6. Copy the `DATABASE_URL` value (we'll need this later)
   - It looks like: `postgresql://postgres:password@host:port/railway`

### ✅ Confirmation:
- [ ] PostgreSQL database service is created
- [ ] You have copied the `DATABASE_URL`
- [ ] Database is showing as "Active" in Railway

**Once confirmed, tell me "Step 3 done" and we'll move to Step 4.**

---

## 📋 STEP 4: Run Database Migrations

**Goal:** Create all the tables in your database.

### Actions:
1. In Railway, click on your PostgreSQL service
2. Click "Connect" tab
3. Click "Query" button (opens database query interface)
4. Open `database/schema.sql` from your local project
5. Copy the ENTIRE contents of `schema.sql`
6. Paste into Railway's query editor
7. Click "Run" or press Ctrl+Enter
8. Wait for success message
9. Now open `database/schema_additions.sql` from your local project
10. Copy the ENTIRE contents (including the new css_code/js_code fields we added)
11. Paste into Railway's query editor
12. Click "Run"

### ✅ Confirmation:
- [ ] Both SQL files executed successfully
- [ ] No errors in Railway query results
- [ ] You can see tables listed (if Railway shows table list)

**Once confirmed, tell me "Step 4 done" and we'll move to Step 5.**

---

## 📋 STEP 5: Deploy Backend Service

**Goal:** Deploy your Express.js backend API.

### Actions:
1. In Railway project, click "New"
2. Select "GitHub Repo" → Select your `exprora` repository
3. Railway will detect it's a Node.js project
4. Click on the newly created service
5. Go to "Settings" tab
6. Set these values:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
7. Go to "Variables" tab
8. Add these environment variables (click "New Variable" for each):
   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   JWT_SECRET = [Generate a random 32+ character string]
   ADMIN_JWT_SECRET = [Generate a different random 32+ character string]
   FRONTEND_URL = https://your-frontend-url.railway.app (we'll update this later)
   NODE_ENV = production
   PORT = 3001
   RAILWAY_PUBLIC_DOMAIN = ${{Railway.PublicDomain}}
   ```

### Generate Secrets:
For `JWT_SECRET` and `ADMIN_JWT_SECRET`, use one of these methods:
- Option 1: Use this command in terminal: `openssl rand -hex 32`
- Option 2: Use online generator: https://randomkeygen.com/
- Option 3: Use any random 32+ character string

### ✅ Confirmation:
- [ ] Backend service is deploying (check "Deployments" tab)
- [ ] All environment variables are set
- [ ] Build is running (you can see logs)

**Once confirmed, tell me "Step 5 done" and we'll move to Step 6.**

---

## 📋 STEP 6: Wait for Backend Deployment & Get URL

**Goal:** Make sure backend is running and get its public URL.

### Actions:
1. In Railway, go to your backend service
2. Click "Deployments" tab
3. Wait for deployment to complete (2-5 minutes)
   - You'll see build logs
   - Look for "Build successful" message
4. Once deployed, go to "Settings" → "Networking"
5. Click "Generate Domain" (if not already generated)
6. Copy the public URL (e.g., `https://your-backend-name.railway.app`)
7. Test the backend:
   - Open the URL in browser
   - You should see a response or error (that's OK, means it's running)
   - Try: `https://your-backend-url.railway.app/health` (if you have health endpoint)

### ✅ Confirmation:
- [ ] Backend deployment completed successfully
- [ ] You have the backend public URL
- [ ] Backend is accessible (even if it shows an error, that's OK)

**Once confirmed, tell me "Step 6 done" and we'll move to Step 7.**

---

## 📋 STEP 7: Deploy Frontend Service

**Goal:** Deploy your Next.js frontend.

### Actions:
1. In Railway project, click "New"
2. Select "GitHub Repo" → Select your `exprora` repository (again)
3. Click on the newly created service
4. Go to "Settings" tab
5. Set these values:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. Go to "Variables" tab
7. Add this environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://your-backend-url.railway.app
   ```
   (Use the backend URL from Step 6)

### ✅ Confirmation:
- [ ] Frontend service is deploying
- [ ] Environment variable is set with backend URL
- [ ] Build is running

**Once confirmed, tell me "Step 7 done" and we'll move to Step 8.**

---

## 📋 STEP 8: Wait for Frontend Deployment & Get URL

**Goal:** Make sure frontend is running and get its public URL.

### Actions:
1. In Railway, go to your frontend service
2. Click "Deployments" tab
3. Wait for deployment to complete (3-7 minutes for Next.js)
   - You'll see build logs
   - Look for "Build successful" message
4. Once deployed, go to "Settings" → "Networking"
5. Click "Generate Domain" (if not already generated)
6. Copy the frontend public URL
7. Test the frontend:
   - Open the URL in browser
   - You should see your marketing homepage!

### ✅ Confirmation:
- [ ] Frontend deployment completed successfully
- [ ] You have the frontend public URL
- [ ] Homepage loads correctly

**Once confirmed, tell me "Step 8 done" and we'll move to Step 9.**

---

## 📋 STEP 9: Update Backend with Frontend URL

**Goal:** Update backend's FRONTEND_URL environment variable.

### Actions:
1. In Railway, go to your backend service
2. Go to "Variables" tab
3. Find `FRONTEND_URL` variable
4. Update it to your frontend URL from Step 8:
   ```
   FRONTEND_URL = https://your-frontend-url.railway.app
   ```
5. Railway will automatically redeploy backend

### ✅ Confirmation:
- [ ] FRONTEND_URL updated
- [ ] Backend is redeploying

**Once confirmed, tell me "Step 9 done" and we'll move to Step 10.**

---

## 📋 STEP 10: Create Admin Account

**Goal:** Create your admin account so you can login.

### Actions:
1. Install Railway CLI (if not installed):
   ```bash
   npm install -g @railway/cli
   ```
2. Login to Railway:
   ```bash
   railway login
   ```
   (This will open browser for authentication)
3. Link to your project:
   ```bash
   railway link
   ```
   (Select your exprora project)
4. Run admin creation script:
   ```bash
   railway run npx tsx backend/create-admin-simple.ts
   ```
5. You should see:
   ```
   ✅ Admin account created successfully!
   Email: shubhambaliyan360@gmail.com
   ```

### ✅ Confirmation:
- [ ] Admin account created successfully
- [ ] You see the success message

**Once confirmed, tell me "Step 10 done" and we'll move to Step 11.**

---

## 📋 STEP 11: Build and Deploy SDK

**Goal:** Build the SDK file and make it available.

### Actions:
1. On your local machine, open terminal
2. Navigate to SDK folder:
   ```bash
   cd /Users/vaibhavbaliyan/Desktop/exprora/sdk
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build SDK:
   ```bash
   npm run build
   ```
5. This creates `backend/public/sdk.js`
6. Go back to project root:
   ```bash
   cd ..
   ```
7. Commit and push SDK file:
   ```bash
   git add backend/public/sdk.js
   git commit -m "Add SDK file for deployment"
   git push
   ```
8. Railway will auto-redeploy backend with SDK file

### ✅ Confirmation:
- [ ] SDK built successfully
- [ ] `backend/public/sdk.js` file exists
- [ ] Code pushed to GitHub
- [ ] Backend is redeploying

**Once confirmed, tell me "Step 11 done" and we'll move to Step 12.**

---

## 📋 STEP 12: Verify SDK is Accessible

**Goal:** Make sure SDK file is served correctly.

### Actions:
1. Wait for backend redeployment to complete (from Step 11)
2. Get your backend URL (from Step 6)
3. Test SDK URL:
   ```
   https://your-backend-url.railway.app/sdk.js
   ```
4. You should see JavaScript code (not 404 error)
5. If you see 404, check:
   - `backend/public/sdk.js` exists in GitHub
   - Backend has redeployed

### ✅ Confirmation:
- [ ] SDK file is accessible via URL
- [ ] You can see JavaScript code when visiting the URL

**Once confirmed, tell me "Step 12 done" and we'll move to Step 13.**

---

## 📋 STEP 13: Test Everything End-to-End

**Goal:** Verify everything works correctly.

### Test Checklist:

#### Test 1: Homepage
- [ ] Visit frontend URL
- [ ] See marketing homepage
- [ ] Login button works

#### Test 2: Signup
- [ ] Click "Get Started" or go to `/signup`
- [ ] Create a test client account
- [ ] Account created successfully

#### Test 3: Client Login
- [ ] Login with test client account
- [ ] See client dashboard
- [ ] Can see "Get Embed Code" button

#### Test 4: Admin Login
- [ ] Go to `/login`
- [ ] Login with:
   - Email: `shubhambaliyan360@gmail.com`
   - Password: `exproramain`
- [ ] See admin dashboard (different from client)

#### Test 5: Embed Code
- [ ] As client, click "Get Embed Code"
- [ ] Copy the embed code
- [ ] Create a test HTML file:
   ```html
   <!DOCTYPE html>
   <html>
   <head>
       <title>Test Page</title>
   </head>
   <body>
       <h1>Test Page</h1>
       <!-- Paste embed code here -->
   </body>
   </html>
   ```
- [ ] Open HTML file in browser
- [ ] Check browser console (F12)
- [ ] Should see SDK loading messages

#### Test 6: Create Experiment
- [ ] As client, create a new experiment
- [ ] Add a variant with CSS/JS code
- [ ] Start the experiment
- [ ] Verify it appears in experiments list

### ✅ Confirmation:
- [ ] All tests passed
- [ ] Everything is working

**Once confirmed, tell me "Step 13 done" and we'll move to Step 14 (optional domain setup).**

---

## 📋 STEP 14: Connect Custom Domain (Optional)

**Goal:** Use your own domain (exprora.com) instead of Railway URLs.

### Actions:
1. In Railway, go to your frontend service
2. Go to "Settings" → "Networking"
3. Click "Custom Domain"
4. Add your domain: `exprora.com`
5. Railway will show DNS instructions
6. Go to your domain registrar (where you bought exprora.com)
7. Add CNAME record as instructed by Railway
8. Wait 5-10 minutes for DNS propagation
9. Railway will automatically generate SSL certificate
10. Update backend `FRONTEND_URL` to `https://exprora.com`
11. Update frontend `NEXT_PUBLIC_API_URL` if needed

### ✅ Confirmation:
- [ ] Domain connected
- [ ] SSL certificate active
- [ ] Site accessible at exprora.com

**Once confirmed, tell me "Step 14 done" - You're live! 🎉**

---

## 🎉 Deployment Complete!

Your Exprora platform is now live on Railway!

### What You Have:
- ✅ Backend API running
- ✅ Frontend website running
- ✅ Database with all tables
- ✅ Admin account created
- ✅ SDK file deployed
- ✅ Everything tested and working

### Next Steps:
1. Share your platform with beta users
2. Monitor Railway usage and costs
3. Collect feedback
4. Iterate and improve

---

## 🆘 Troubleshooting

If you encounter issues at any step, let me know:
- What step you're on
- What error you're seeing
- Screenshots if possible

I'll help you fix it before moving to the next step!

---

**Ready to start? Let's begin with Step 1! 🚀**

