-- 08_fix_rls_products.sql
-- Fix RLS policies to allow public access to active products

-- ============================================
-- FIX PRODUCTS RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_admin_read" ON products;
DROP POLICY IF EXISTS "products_admin_write" ON products;

-- Public can read active products (ANON role)
CREATE POLICY "products_public_read" ON products 
  FOR SELECT TO anon USING (is_active = true);

-- Authenticated users can also read active products
CREATE POLICY "products_auth_read" ON products 
  FOR SELECT TO authenticated USING (is_active = true);

-- Admins can read all products (including inactive)
CREATE POLICY "products_admin_read" ON products 
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
  );

-- Only admins can write products
CREATE POLICY "products_admin_write" ON products 
  FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
  );

-- ============================================
-- VERIFY PRODUCTS DATA
-- ============================================

-- Check if products exist and are active
SELECT 
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE is_active = true) as active_products,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_products
FROM products;
