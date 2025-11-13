# Exprora Setup Instructions

## 🎉 What's Been Built

### 1. Marketing Homepage (`/`)
- Beautiful landing page explaining A/B testing and Split URL testing
- Benefits section showing growth statistics
- Features showcase
- Pricing plans (Starter, Professional, Enterprise)
- Login button in top right corner

### 2. Login Page (`/login`)
- Email/password login
- "Remember me" checkbox
- Google login button (placeholder - needs OAuth setup)
- Sign up link
- Automatically detects if you're admin or client

### 3. Client Dashboard (`/dashboard`)
- Shows embed code prominently at the top
- Stats: Total experiments, visitors, conversions
- Recent experiments list
- "Get Embed Code" button opens modal with copyable code

### 4. Admin Dashboard (`/admin/dashboard`)
- Different from client dashboard
- Shows all clients, revenue, experiments
- Recent clients table with plans and status
- Links to view all clients and analytics

### 5. Embed Code Generation
- Each client gets unique embed code
- Code includes their API key
- Easy copy-to-clipboard functionality
- Instructions included

## 🔐 Creating Your Admin Account

To create your admin account (owner account), run:

```bash
cd backend
npx tsx src/scripts/create-admin.ts
```

Enter:
- Email: your email (e.g., admin@exprora.com)
- Name: Your name
- Password: Your password

This will create your admin account in the `admin_users` table.

## 🚀 Next Steps

### 1. Set Environment Variables

Create `.env` file in `backend/`:

```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secret_key_at_least_32_characters_long
ADMIN_JWT_SECRET=your_admin_secret_key_at_least_32_characters_long
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Run Database Migrations

```bash
# Make sure you have PostgreSQL running
# Run the schema files in order:
psql -U your_user -d your_database -f database/schema.sql
psql -U your_user -d your_database -f database/schema_additions.sql
```

### 3. Start Backend

```bash
cd backend
npm install
npm run dev
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Access the Platform

- Homepage: http://localhost:3000
- Login: http://localhost:3000/login
- Admin Dashboard: http://localhost:3000/admin/dashboard (after admin login)
- Client Dashboard: http://localhost:3000/dashboard (after client login)

## 📝 Features Implemented

✅ Marketing homepage with A/B testing info
✅ Pricing plans display
✅ Login page with remember me and Google option
✅ Admin dashboard (different from client)
✅ Client dashboard with embed code
✅ Embed code generation endpoint
✅ Unique smartcode for each client
✅ Admin can see all clients and their plans

## 🔄 What's Next (Optional)

1. **Google OAuth**: Implement actual Google login (currently placeholder)
2. **SDK File**: Create the actual `/sdk.js` file that gets loaded
3. **Pricing Updates**: Update pricing when you have final numbers
4. **Email Service**: Set up email sending for password resets
5. **Domain Setup**: Configure exprora.com domain

## 🎨 Customization

- Update pricing in `frontend/src/app/page.tsx` (search for "Pricing Section")
- Update colors/branding in Tailwind classes
- Add more sections to homepage as needed

## 📧 Support

The platform is ready to use! Clients can:
1. Sign up
2. Get their embed code
3. Add it to their website
4. Start creating A/B tests

You (admin) can:
1. Login with your admin credentials
2. See all clients
3. View their plans and status
4. Manage subscriptions

