-- Additional tables for optional features

-- Heatmaps data
CREATE TABLE heatmap_data (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    page_url TEXT NOT NULL,
    x_coordinate INTEGER NOT NULL,
    y_coordinate INTEGER NOT NULL,
    click_count INTEGER DEFAULT 1,
    scroll_depth INTEGER,
    element_selector TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_heatmap_account_url ON heatmap_data(account_id, page_url);
CREATE INDEX idx_heatmap_experiment ON heatmap_data(experiment_id);

-- Session recordings
CREATE TABLE session_recordings (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    page_url TEXT NOT NULL,
    recording_data JSONB NOT NULL, -- Events, DOM snapshots, etc.
    duration INTEGER, -- in seconds
    page_views INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recordings_account_visitor ON session_recordings(account_id, visitor_id);
CREATE INDEX idx_recordings_session ON session_recordings(session_id);

-- Email notifications
CREATE TABLE email_notifications (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    notification_type VARCHAR(100) NOT NULL, -- experiment_completed, conversion_goal, etc.
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_notifications_account ON email_notifications(account_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);

-- Password reset tokens
CREATE TABLE password_reset_tokens (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_account ON password_reset_tokens(account_id);

-- Advanced targeting rules (extend experiments table)
ALTER TABLE experiments ADD COLUMN IF NOT EXISTS targeting_rules_advanced JSONB;

-- Visual editor snapshots
CREATE TABLE visual_editor_snapshots (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES variants(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL, -- DOM structure, changes, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshots_experiment ON visual_editor_snapshots(experiment_id);
CREATE INDEX idx_snapshots_variant ON visual_editor_snapshots(variant_id);

-- Add separate CSS and JS code fields for code editor
ALTER TABLE variants ADD COLUMN IF NOT EXISTS css_code TEXT;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS js_code TEXT;

