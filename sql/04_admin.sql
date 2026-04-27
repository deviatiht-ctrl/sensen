-- 04_admin.sql
-- EDIT THIS FILE before running
-- Replace 'admin@example.com' with your real email address
-- Then run in Supabase SQL editor

-- ============================================
-- SET ADMIN USER
-- ============================================
-- Replace 'admin@example.com' with your actual email address
-- that you will use to log into the admin panel

INSERT INTO admin_users (email) 
VALUES ('laurorejeanclarens0@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- To add multiple admins, uncomment and modify:
-- INSERT INTO admin_users (email) VALUES 
--   ('admin1@example.com'),
--   ('admin2@example.com')
-- ON CONFLICT (email) DO NOTHING;
