# Exprora - A/B Testing Platform

Complete A/B testing and conversion optimization platform with admin dashboard, client management, and billing system.

## Architecture Overview

### System Components:
1. **Admin Dashboard** - Your personal dashboard to manage all clients, view revenue, subscriptions
2. **Client Portal** - Each client gets their own login to manage their A/B tests
3. **Backend API** - Handles all business logic, billing, multi-tenancy
4. **JavaScript SDK** - Clients embed this on their websites
5. **Database** - PostgreSQL for all data storage

## How It Works

### For You (Admin):
- Login to admin dashboard at `/admin`
- See all clients, their subscription status, revenue
- Manage pricing plans
- View analytics across all clients
- Handle billing and subscriptions

### For Clients:
- Sign up at `/signup` or you create accounts for them
- Login at `/login` with their credentials
- Get their own dashboard to create A/B tests
- Receive unique API key to embed on their website
- Manage their experiments, view results

### Billing System:
- Stripe integration for payments
- Subscription tiers (Starter, Professional, Enterprise)
- Monthly/annual billing
- Automatic invoice generation
- Usage-based pricing options

## Getting Started

See individual README files in each directory for setup instructions.

