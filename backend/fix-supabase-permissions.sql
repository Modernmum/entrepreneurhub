-- Fix Supabase permissions for client login
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('testing_clients', 'bot_test_results', 'bot_test_issues');

-- Disable RLS for testing (or create proper policies)
ALTER TABLE testing_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE bot_test_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE bot_test_issues DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, create a policy for anonymous read access:
-- DROP POLICY IF EXISTS "Allow anonymous read access" ON testing_clients;
-- CREATE POLICY "Allow anonymous read access" ON testing_clients
--   FOR SELECT
--   USING (true);

-- DROP POLICY IF EXISTS "Allow anonymous read access" ON bot_test_results;
-- CREATE POLICY "Allow anonymous read access" ON bot_test_results
--   FOR SELECT
--   USING (true);

-- DROP POLICY IF EXISTS "Allow anonymous read access" ON bot_test_issues;
-- CREATE POLICY "Allow anonymous read access" ON bot_test_issues
--   FOR SELECT
--   USING (true);

-- Verify permissions
SELECT schemaname, tablename, tableowner
FROM pg_tables
WHERE tablename IN ('testing_clients', 'bot_test_results', 'bot_test_issues');
