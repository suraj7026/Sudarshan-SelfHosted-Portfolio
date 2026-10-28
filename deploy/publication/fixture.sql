-- Disposable CI database only; never run against production.
CREATE TABLE profile (id integer PRIMARY KEY, name text, title text, subtitle text, about_me text, resume_url text, social_links jsonb);
INSERT INTO profile VALUES (1, 'CI Fixture', 'Test role', '', 'Synthetic test data', '', '{"github":"https://example.invalid"}');
CREATE TABLE experience (id integer PRIMARY KEY, company text, role text, start_date timestamptz, end_date timestamptz, location text, achievements jsonb);
INSERT INTO experience VALUES (1, 'CI Company', 'Engineer', '2025-01-01', NULL, 'Test', '["Fixture achievement"]');
CREATE TABLE projects (id integer PRIMARY KEY, title text, description text, tech_stack jsonb, repo_link text, live_link text, featured boolean, display_order integer);
INSERT INTO projects VALUES (1, 'Featured fixture', 'Test', '["Go"]', '', '', true, 1), (2, 'Other fixture', 'Test', '["React"]', '', '', false, 2);
CREATE TABLE skills (id integer PRIMARY KEY, category text, skill text, description text, icon_name text, icon_color text);
INSERT INTO skills VALUES (1, 'Backend', 'Go', 'Fixture', 'code', 'blue');
CREATE TABLE certifications (id integer PRIMARY KEY, name text, issuer text, issue_date timestamptz, credential_url text, display_order integer);
INSERT INTO certifications VALUES (1, 'Fixture certificate', 'CI', '2025-01-01', '', 1);
