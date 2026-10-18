-- PostgreSQL Schema for AU Fest - Adani University Fest & Club Management
-- Note: All tables use GENERATED ALWAYS AS IDENTITY primary keys as required.

DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS sponsors CASCADE;
DROP TABLE IF EXISTS organisers CASCADE;
DROP TABLE IF EXISTS registrations CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'club_admin', 'student')) NOT NULL
);

CREATE TABLE clubs (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT
);

CREATE TABLE members (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    position VARCHAR(100) CHECK (position IN ('President', 'Vice-President', 'Member')) NOT NULL
);

CREATE TABLE venues (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL
);

CREATE TABLE events (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    venue_id INT REFERENCES venues(id),
    title VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Planned', 'Ongoing', 'Completed')) DEFAULT 'Planned'
);

CREATE TABLE registrations (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    attended BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, user_id)
);

CREATE TABLE organisers (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    member_id INT REFERENCES members(id) ON DELETE CASCADE,
    role VARCHAR(100)
);

CREATE TABLE sponsors (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE payments (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    sponsor_id INT REFERENCES sponsors(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('Pending', 'Approved', 'Rejected')) DEFAULT 'Pending'
);

CREATE TABLE achievements (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id INT REFERENCES clubs(id) ON DELETE CASCADE,
    description TEXT NOT NULL
);

CREATE TABLE feedback (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id INT REFERENCES events(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT
);
