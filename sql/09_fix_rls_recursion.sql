-- 09_fix_rls_recursion.sql
-- Fix infinite recursion in RLS policies

-- ============================================
-- CREATE ADMIN CHECK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE email = user_email
  );
END;
$$;

-- ============================================
-- FIX ADMIN_USERS POLICY
-- ============================================
DROP POLICY IF EXISTS "admin_users_admin_only" ON admin_users;

CREATE POLICY "admin_users_admin_only" ON admin_users 
  FOR ALL USING (is_admin(auth.email()));

-- ============================================
-- FIX PRODUCTS POLICIES
-- ============================================
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_admin_read" ON products;
DROP POLICY IF EXISTS "products_admin_write" ON products;

-- Public can read active products
CREATE POLICY "products_public_read" ON products 
  FOR SELECT USING (is_active = true);

-- Admins can read all products (including inactive)
CREATE POLICY "products_admin_read" ON products 
  FOR SELECT TO authenticated USING (is_admin(auth.email()));

-- Only admins can write products
CREATE POLICY "products_admin_write" ON products 
  FOR ALL TO authenticated USING (is_admin(auth.email()));

-- ============================================
-- FIX CUSTOMERS POLICY
-- ============================================
DROP POLICY IF EXISTS "customers_own_read" ON customers;

CREATE POLICY "customers_own_read" ON customers 
  FOR SELECT USING (
    auth.uid() = id 
    OR is_admin(auth.email())
  );

-- ============================================
-- FIX ORDERS POLICIES
-- ============================================
DROP POLICY IF EXISTS "orders_own_read" ON orders;
DROP POLICY IF EXISTS "orders_admin_update" ON orders;

CREATE POLICY "orders_own_read" ON orders 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR is_admin(auth.email())
  );

CREATE POLICY "orders_admin_update" ON orders 
  FOR UPDATE USING (is_admin(auth.email()));

-- ============================================
-- FIX SETTINGS POLICY
-- ============================================
DROP POLICY IF EXISTS "settings_admin_write" ON store_settings;

CREATE POLICY "settings_admin_write" ON store_settings 
  FOR ALL TO authenticated USING (is_admin(auth.email()));

-- ============================================
-- ENABLE RLS ON ALL TABLES (if not already enabled)
-- ============================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
