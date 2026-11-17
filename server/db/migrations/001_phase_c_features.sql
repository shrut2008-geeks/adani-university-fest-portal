-- ==============================================================================
-- AU FEST - ADANI UNIVERSITY CLUB & EVENT PORTAL
-- Phase C Database Migration: 001_phase_c_features.sql
-- Description: Non-destructive migration adding hackathon teams, expenses ledger,
--              campus announcements, and administrative audit logging.
-- Safe for execution in Neon Web SQL Editor. Does NOT delete or drop existing tables.
-- ==============================================================================

-- 1. Campus Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'info', -- 'urgent', 'info', 'notice'
    active BOOLEAN DEFAULT TRUE,
    link VARCHAR(255) DEFAULT '/events',
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(active);

-- 2. Hackathons & Competitions Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    leader_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    project_title VARCHAR(255),
    rank_position INTEGER DEFAULT NULL, -- 1 = 1st Place, 2 = 2nd Place, 3 = 3rd Place
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_event ON teams(event_id);

-- 3. Team Members Table (Multi-Student Registration)
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    student_email VARCHAR(150) NOT NULL,
    role VARCHAR(100) DEFAULT 'Member', -- 'Leader', 'Developer', 'Designer', 'Hardware Lead'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(student_email);

-- 4. Financial & Budget Expense Tracking Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
    club_id INTEGER REFERENCES clubs(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(100) DEFAULT 'Operations', -- 'Sound & Stage', 'Catering', 'Prizes', 'Marketing', 'Equipment'
    amount NUMERIC(12, 2) NOT NULL,
    receipt_url VARCHAR(500),
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_event ON expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_club ON expenses(club_id);

-- 5. Administrative Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(150),
    action VARCHAR(100) NOT NULL, -- 'REGISTRATION_DELETED', 'CHECK_IN_VERIFIED', 'PAYMENT_RECORDED', 'EVENT_CREATED', 'EXPENSE_LOGGED'
    entity_type VARCHAR(50) NOT NULL, -- 'registrations', 'events', 'sponsors', 'expenses'
    entity_id INTEGER,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==============================================================================
-- Sample Baseline Records (Safe execution with DO $$ block to avoid duplicate inserts)
-- ==============================================================================
DO $$
BEGIN
    -- Seed campus announcements if table is empty
    IF NOT EXISTS (SELECT 1 FROM announcements LIMIT 1) THEN
        INSERT INTO announcements (title, message, priority, active, link)
        VALUES 
            ('RoboWars Challenge Venue', 'RoboWars challenge venue moved to Tech Lab Alpha (Block B) due to lab testing. Schedule starts at 2:00 PM.', 'urgent', TRUE, '/events'),
            ('National Hackathon Round 1', 'Problem statements for National Collegiate Hackathon 2026 are live! Review team track assignments.', 'info', TRUE, '/events'),
            ('QR Gate Check-In Active', 'Present your digital QR pass from "My Event Passes" for mobile scanner check-in at venue doors.', 'notice', TRUE, '/registrations');
    END IF;

    -- Seed sample audit log
    IF NOT EXISTS (SELECT 1 FROM audit_logs LIMIT 1) THEN
        INSERT INTO audit_logs (user_email, action, entity_type, details)
        VALUES ('admin@adaniuni.ac.in', 'SYSTEM_INITIALIZED', 'system', '{"phase": "Phase C Initialized", "platform": "AU Fest Portal"}');
    END IF;
END $$;
