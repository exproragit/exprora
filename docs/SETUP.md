# Exprora Setup Guide

## Complete Setup Instructions

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Stripe account (for billing)

### 1. Database Setup

```bash
# Create PostgreSQL database
createdb exprora

# Run the schema
psql exprora < database/schema.sql

# Create admin user (run in psql)
INSERT INTO admin_users (email, password_hash, name) 
VALUES ('admin@exprora.com', '$2a$10$...', 'Admin User');
# Note: Generate password hash using bcrypt
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL, JWT secrets, Stripe keys
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your API URL
npm run dev
```

### 4. SDK Build

```bash
cd sdk
npm install
npm run build
```

## How It Works

### For You (Admin):
1. Login at `/admin/login` (or toggle to Admin in login page)
2. View all clients in dashboard
3. Create new client accounts
4. Manage subscriptions and billing
5. View revenue analytics

### For Clients:
1. Sign up at `/signup` or you create account for them
2. Login at `/login`
3. Get their API key from profile
4. Embed SDK on their website
5. Create A/B tests in dashboard

### Billing:
- Stripe integration handles all payments
- Webhooks update subscription status
- Automatic invoice generation
- Support for monthly/annual billing

## Deployment

1. Deploy backend to your server (Heroku, AWS, etc.)
2. Deploy frontend to Vercel/Netlify
3. Update API URLs in frontend .env
4. Configure Stripe webhooks
5. Point your domain (exprora.com) to frontend

## Next Steps

- Set up your admin account
- Configure Stripe
- Customize branding
- Add more features as needed

