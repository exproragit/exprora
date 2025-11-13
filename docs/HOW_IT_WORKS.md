# How Exprora Works - Complete Guide

## 🎯 Overview

Exprora is a complete A/B testing SaaS platform where:
- **You** (the owner) have an admin dashboard to manage all clients
- **Clients** have their own login to manage their A/B tests
- **Billing** is automated through Stripe
- **SDK** is embedded on client websites to run tests

---

## 👤 For You (Admin/Owner)

### 1. Admin Login
- Go to `/login` and toggle to "Admin Login"
- Login with your admin credentials
- You'll see your admin dashboard at `/admin/dashboard`

### 2. Admin Dashboard Features

**View All Clients:**
- See total number of clients
- Active vs trial clients
- Total revenue
- Recent client signups

**Client Management:**
- View all clients with their subscription status
- Create new client accounts manually
- Update client subscriptions
- View client details and activity

**Revenue Analytics:**
- Total revenue across all clients
- Monthly revenue breakdown
- Revenue by subscription plan
- Payment history

**Actions You Can Take:**
1. **Create Client Account:**
   - Go to clients page
   - Click "Create New Client"
   - Fill in company name, email, password
   - Set subscription plan (starter/professional/enterprise)
   - Client gets 14-day trial automatically

2. **Manage Subscriptions:**
   - Upgrade/downgrade client plans
   - Change billing cycle (monthly/annual)
   - Cancel subscriptions
   - View payment history

3. **Monitor Revenue:**
   - View total revenue
   - See monthly/annual trends
   - Track which plans are most popular

---

## 🏢 For Your Clients

### 1. Client Signup/Login

**Option A: Self-Signup**
- Client goes to `/signup`
- Fills in company name, email, password
- Gets 14-day free trial automatically
- Redirected to their dashboard

**Option B: You Create Account**
- You create account from admin panel
- Send client their login credentials
- Client logs in at `/login`

### 2. Client Dashboard

**What Clients See:**
- Total experiments they've created
- Active experiments count
- Total visitors to their site
- Conversion statistics
- Recent experiments list

**Client Actions:**
1. **Get API Key:**
   - Go to Profile/Settings
   - Copy their unique API key
   - Use this to embed SDK on their website

2. **Create A/B Tests:**
   - Click "New Experiment"
   - Choose test type (A/B, Multivariate, Split URL)
   - Set traffic allocation
   - Create variants
   - Start the test

3. **View Results:**
   - See real-time analytics
   - Conversion rates per variant
   - Statistical significance
   - Export data

---

## 💳 How Billing Works

### Subscription Plans

**Starter Plan:**
- $49/month or $490/year
- 5 experiments max
- 10,000 visitors/month
- Basic features

**Professional Plan:**
- $149/month or $1,490/year
- 25 experiments max
- 100,000 visitors/month
- Advanced features + API access

**Enterprise Plan:**
- $499/month or $4,990/year
- Unlimited experiments
- Unlimited visitors
- All features + white-label

### Payment Flow

1. **Client Signs Up:**
   - Gets 14-day free trial
   - No payment required during trial

2. **Trial Ends:**
   - Client must subscribe to continue
   - Redirected to payment page
   - Stripe handles payment

3. **Automatic Billing:**
   - Stripe charges monthly/annual
   - Webhooks update subscription status
   - Invoices generated automatically
   - Payment failures handled automatically

4. **You Get Paid:**
   - All payments go to your Stripe account
   - View revenue in admin dashboard
   - Export financial reports

### Setting Up Stripe

1. **Create Stripe Account:**
   - Go to stripe.com
   - Create account
   - Get API keys

2. **Configure in Backend:**
   - Add `STRIPE_SECRET_KEY` to `.env`
   - Add `STRIPE_WEBHOOK_SECRET` to `.env`
   - Set up webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`

3. **Create Products in Stripe:**
   - Create 3 products (Starter, Professional, Enterprise)
   - Create monthly and annual prices
   - Note the price IDs

4. **Update Code:**
   - Map Stripe price IDs to plans in webhook handler
   - Or use product metadata

---

## 🔐 Authentication System

### Admin Authentication
- Separate admin login
- Uses `ADMIN_JWT_SECRET`
- Access to admin routes only
- Can manage all clients

### Client Authentication
- Client login at `/login`
- Uses `JWT_SECRET`
- Access to their own data only
- Multi-tenant isolation

### API Key Authentication
- Clients get unique API key
- Used by SDK to authenticate
- Validates subscription status
- Rate limited

---

## 🧪 A/B Testing Engine

### How Tests Work

1. **Client Creates Test:**
   - Defines experiment name, type
   - Sets traffic allocation (e.g., 50% of visitors)
   - Creates variants (A, B, C, etc.)

2. **SDK on Client Website:**
   - Client embeds SDK script
   - SDK initializes with API key
   - SDK requests active experiments
   - Server assigns variant to visitor

3. **Variant Assignment:**
   - Consistent assignment (same visitor = same variant)
   - Traffic splitting based on percentages
   - Stored in database

4. **Tracking:**
   - SDK tracks pageviews automatically
   - Client can track custom events
   - Conversions tracked via `Exprora.conversion()`

5. **Results:**
   - Real-time analytics in dashboard
   - Conversion rates per variant
   - Statistical significance calculations
   - Export capabilities

---

## 📊 Database Structure

### Key Tables

**accounts:**
- All client accounts
- Subscription info
- API keys
- Billing details

**experiments:**
- All A/B tests
- Status, dates, goals
- Linked to account

**variants:**
- Test variants (A, B, C)
- Visual changes
- Custom code

**experiment_assignments:**
- Which visitor sees which variant
- Ensures consistency

**events:**
- All tracked events
- Pageviews, clicks, conversions
- Revenue data

**invoices:**
- All billing records
- Payment status
- Stripe integration

---

## 🚀 Getting Started Checklist

### Initial Setup
- [ ] Set up PostgreSQL database
- [ ] Run database schema
- [ ] Create admin user account
- [ ] Configure backend `.env`
- [ ] Set up Stripe account
- [ ] Configure Stripe webhooks
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Point domain to frontend

### First Client
- [ ] Create test client account
- [ ] Give them login credentials
- [ ] Show them how to get API key
- [ ] Help them embed SDK
- [ ] Create test experiment together

### Marketing
- [ ] Set up landing page
- [ ] Add pricing page
- [ ] Set up signup flow
- [ ] Configure email notifications
- [ ] Set up customer support

---

## 💡 Pro Tips

1. **Start with Free Trial:**
   - 14-day trial gets clients in
   - Easy to convert to paid

2. **Monitor Usage:**
   - Watch for clients hitting limits
   - Upsell to higher plans

3. **Customer Support:**
   - Help clients set up first test
   - Provide SDK integration guide
   - Offer onboarding calls

4. **Pricing Strategy:**
   - Starter: Small businesses
   - Professional: Growing companies
   - Enterprise: Large organizations

5. **Analytics:**
   - Track churn rate
   - Monitor MRR (Monthly Recurring Revenue)
   - Analyze which features drive upgrades

---

## 📞 Support & Help

For technical issues:
- Check logs in backend
- Verify database connections
- Test API endpoints
- Check Stripe webhook logs

For business questions:
- Review client activity logs
- Check subscription statuses
- Monitor payment failures
- Review experiment performance

---

## 🎉 You're Ready!

Your complete A/B testing SaaS platform is ready. You can:
- ✅ Manage unlimited clients
- ✅ Automate billing
- ✅ Track revenue
- ✅ Scale your business

Good luck with Exprora! 🚀

