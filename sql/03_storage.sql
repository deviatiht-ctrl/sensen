-- 03_storage.sql
-- Run third in Supabase SQL editor
-- Creates storage bucket for product images and sets policies

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================
-- Note: Run this in Supabase Dashboard > Storage or use the SQL below if supported
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Public can read all product images
CREATE POLICY "products_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'products');

-- Only admins can upload images
CREATE POLICY "products_images_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'products' AND
    auth.email() IN (SELECT email FROM admin_users)
  );

-- Only admins can update images
CREATE POLICY "products_images_admin_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'products' AND
    auth.email() IN (SELECT email FROM admin_users)
  );

-- Only admins can delete images
CREATE POLICY "products_images_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'products' AND
    auth.email() IN (SELECT email FROM admin_users)
  );
