-- Exprora Database Schema
-- Complete database structure for A/B testing platform

-- Admin Users Table (Your personal admin account)
CREATE TABLE admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'super_admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clients/Accounts Table (Your clients who use the platform)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    subscription_plan VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, cancelled, expired
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    trial_ends_at TIMESTAMP,
    subscription_ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Subscription Plans Table
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_annual DECIMAL(10, 2) NOT NULL,
    max_experiments INTEGER,
    max_visitors INTEGER,
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Experiments Table (A/B Tests)
CREATE TABLE experiments (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- ab_test, multivariate, split_url
    status VARCHAR(50) DEFAULT 'draft', -- draft, running, paused, completed, archived
    traffic_allocation INTEGER DEFAULT 100, -- percentage of traffic
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    primary_goal VARCHAR(255),
    secondary_goals JSONB,
    targeting_rules JSONB,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Variants Table (A, B, C variants of experiments)
CREATE TABLE variants (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- control, variant
    traffic_percentage INTEGER DEFAULT 50,
    changes JSONB, -- Visual editor changes
    custom_code TEXT, -- Custom CSS/JS if needed
    is_control BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visitors/Users Table (People visiting client websites)
CREATE TABLE visitors (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL, -- Unique visitor identifier
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, visitor_id)
);

-- Experiment Assignments (Which variant each visitor sees)
CREATE TABLE experiment_assignments (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, visitor_id)
);

-- Events/Conversions Table
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- pageview, click, conversion, goal
    event_name VARCHAR(255),
    event_value DECIMAL(10, 2),
    url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics Aggregated Data (For fast reporting)
CREATE TABLE analytics_daily (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    visitors INTEGER DEFAULT 0,
    pageviews INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 4) DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, experiment_id, variant_id, date)
);

-- Billing/Invoices Table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    subscription_plan_id INTEGER REFERENCES subscription_plans(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, refunded
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    invoice_date DATE NOT NULL,
    due_date DATE,
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    invoice_id INTEGER REFERENCES invoices(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_method VARCHAR(50),
    stripe_charge_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin Activity Log
CREATE TABLE admin_activity_log (
    id SERIAL PRIMARY KEY,
    admin_user_id INTEGER REFERENCES admin_users(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Activity Log
CREATE TABLE client_activity_log (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    user_id INTEGER,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id INTEGER,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_experiments_account_id ON experiments(account_id);
CREATE INDEX idx_experiments_status ON experiments(status);
CREATE INDEX idx_variants_experiment_id ON variants(experiment_id);
CREATE INDEX idx_visitors_account_id ON visitors(account_id);
CREATE INDEX idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX idx_assignments_experiment_visitor ON experiment_assignments(experiment_id, visitor_id);
CREATE INDEX idx_events_account_experiment ON events(account_id, experiment_id);
CREATE INDEX idx_events_visitor ON events(visitor_id);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_analytics_daily_date ON analytics_daily(date);
CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_accounts_api_key ON accounts(api_key);
CREATE INDEX idx_accounts_email ON accounts(email);

-- Insert Default Subscription Plans
INSERT INTO subscription_plans (name, slug, price_monthly, price_annual, max_experiments, max_visitors, features) VALUES
('Starter', 'starter', 49.00, 490.00, 5, 10000, '{"ab_testing": true, "basic_analytics": true, "email_support": true}'),
('Professional', 'professional', 149.00, 1490.00, 25, 100000, '{"ab_testing": true, "multivariate": true, "advanced_analytics": true, "priority_support": true, "api_access": true}'),
('Enterprise', 'enterprise', 499.00, 4990.00, -1, -1, '{"ab_testing": true, "multivariate": true, "advanced_analytics": true, "dedicated_support": true, "api_access": true, "white_label": true, "custom_integrations": true}');

