-- Seed Data for AU Fest & Adani University Club Management
-- Demo student accounts use password: adani123 (admin and clubadmin set via server/.env)

INSERT INTO users (email, password_hash, role) VALUES 
('admin@adani.ac.in', '$2a$10$PLACEHOLDER_SET_BY_SEEDRUNNER_FROM_ENV_ADMIN', 'admin'),
('clubadmin@adani.ac.in', '$2a$10$PLACEHOLDER_SET_BY_SEEDRUNNER_FROM_ENV_CLUBADMIN', 'club_admin'),
('student@adani.ac.in', '$2a$10$H9xifR4Ek4wzHziICrH9FOAbBB6iO8R4KEhIuXtV8soi9dwrK3HeS', 'student'),
('rohit.sharma@adani.ac.in', '$2a$10$H9xifR4Ek4wzHziICrH9FOAbBB6iO8R4KEhIuXtV8soi9dwrK3HeS', 'student'),
('ananya.patel@adani.ac.in', '$2a$10$H9xifR4Ek4wzHziICrH9FOAbBB6iO8R4KEhIuXtV8soi9dwrK3HeS', 'student');

INSERT INTO clubs (name, category, description) VALUES 
('Tech & Cultural Society', 'Flagship Fest', 'Adani University''s Annual Tech and Cultural Fest Committee'),
('RoboTech Club', 'Engineering & Robotics', 'Designing autonomous combat robots, rovers, and IoT automation'),
('CodeOrbit Guild', 'Coding & AI', 'Competitive coding, open-source development, and deep learning research'),
('Aura Cultural Society', 'Cultural & Arts', 'Music, theatrical performances, dance, and creative media productions');

INSERT INTO venues (name, capacity) VALUES 
('Main Auditorium', 500), 
('Open Grounds', 2000),
('Tech Lab Alpha', 80),
('Campus Amphitheatre', 350);

INSERT INTO members (user_id, club_id, position) VALUES 
(2, 1, 'President'),
(3, 1, 'Member'),
(4, 2, 'Vice-President'),
(5, 3, 'President'),
(4, 1, 'Member');

INSERT INTO events (club_id, venue_id, title, date, status) VALUES 
(1, 1, 'National Collegiate Hackathon', '2026-11-15 09:00:00', 'Planned'),
(1, 2, 'RoboWars Championship', '2026-11-16 10:00:00', 'Planned'),
(1, 4, 'Annual Fest Rock Night', '2026-11-16 19:00:00', 'Planned'),
(2, 3, 'Autonomous Rover Challenge', '2026-11-17 14:00:00', 'Ongoing'),
(3, 1, 'AI Frontiers Symposium', '2026-10-10 10:00:00', 'Completed');

INSERT INTO organisers (event_id, member_id, role) VALUES 
(1, 1, 'Lead Hackathon Director'),
(1, 2, 'Tech Track Coordinator'),
(2, 3, 'Arena Marshal'),
(3, 1, 'Stage & Artist Coordinator');

INSERT INTO sponsors (name) VALUES 
('Adani Enterprises'),
('Adani Solar & Renewables'),
('NVIDIA Deep Learning'),
('Red Bull India'),
('GitHub Campus');

INSERT INTO payments (event_id, sponsor_id, amount, status) VALUES 
(1, 1, 250000.00, 'Approved'),
(1, 3, 120000.00, 'Approved'),
(2, 2, 180000.00, 'Approved'),
(3, 4, 75000.00, 'Pending'),
(5, NULL, 50000.00, 'Approved'),
(4, 5, 45000.00, 'Pending');

INSERT INTO achievements (club_id, description) VALUES 
(1, 'Winner of Best Western-India Collegiate Fest 2025 with 12,000+ attendees'),
(1, 'Pioneered India''s first zero-carbon sustainable collegiate tech hackathon'),
(2, '1st Place in National RoboWars Championship 2025 at IIT Bombay'),
(3, 'Top 10 Finalist in Global ACM-ICPC Regional Hackathon');

INSERT INTO registrations (event_id, user_id, attended) VALUES 
(1, 3, false),
(1, 4, false),
(2, 3, false),
(5, 3, true),
(5, 4, true);

INSERT INTO feedback (event_id, user_id, rating, comment) VALUES 
(5, 3, 5, 'Mindblowing keynote by AI researchers and great hands-on GPU labs!'),
(5, 4, 4, 'Well organised logistics and high quality food stalls.');
