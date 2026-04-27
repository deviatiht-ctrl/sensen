-- 02_rls.sql
-- Run second in Supabase SQL editor
-- Enables Row Level Security and creates all policies

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STORE SETTINGS POLICIES
-- ============================================
-- Anyone can read settings
CREATE POLICY "settings_public_read" ON store_settings 
  FOR SELECT USING (true);

-- Only admins can write settings
CREATE POLICY "settings_admin_write" ON store_settings 
  FOR ALL TO authenticated USING (is_admin(auth.email()));

-- ============================================
-- ADMIN CHECK FUNCTION (Security Definer)
-- ============================================
-- This function avoids infinite recursion by using security definer
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
-- ADMIN USERS POLICIES
-- ============================================
-- Drop existing policy
DROP POLICY IF EXISTS "admin_users_admin_only" ON admin_users;

-- Only admins can see admin users table (uses security definer function)
CREATE POLICY "admin_users_admin_only" ON admin_users 
  FOR ALL USING (is_admin(auth.email()));

-- ============================================
-- PRODUCTS POLICIES
-- ============================================
-- Drop existing policy if exists
DROP POLICY IF EXISTS "products_public_read" ON products;

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
-- CUSTOMERS POLICIES
-- ============================================
-- Users see own record, admins see all
CREATE POLICY "customers_own_read" ON customers 
  FOR SELECT USING (
    auth.uid() = id 
    OR is_admin(auth.email())
  );

-- Users can insert their own record
CREATE POLICY "customers_own_write" ON customers 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own record
CREATE POLICY "customers_own_update" ON customers 
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- CART ITEMS POLICIES
-- ============================================
-- Users manage only their own cart
CREATE POLICY "cart_own" ON cart_items 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- ORDERS POLICIES
-- ============================================
-- Users see own orders, admins see all
CREATE POLICY "orders_own_read" ON orders 
  FOR SELECT USING (
    auth.uid() = user_id 
    OR is_admin(auth.email())
  );

-- Allow inserts (validated by application logic)
CREATE POLICY "orders_own_insert" ON orders 
  FOR INSERT WITH CHECK (true);

-- Only admins can update orders
CREATE POLICY "orders_admin_update" ON orders 
  FOR UPDATE USING (is_admin(auth.email()));
