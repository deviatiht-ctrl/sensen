-- 07_add_product_columns.sql
-- Migration to add missing product columns and tables
-- Run this if you get 'column does not exist' or 'relation does not exist' errors

-- ============================================
-- CREATE PRODUCT_VARIANTS TABLE IF NOT EXISTS
-- ============================================
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  color text,
  size text,
  sku text UNIQUE,
  stock integer DEFAULT 0,
  price_adjustment numeric DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

-- Add is_featured column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_featured') THEN
    ALTER TABLE products ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Add is_new column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_new') THEN
    ALTER TABLE products ADD COLUMN is_new boolean DEFAULT false;
  END IF;
END $$;

-- Add is_sale column if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_sale') THEN
    ALTER TABLE products ADD COLUMN is_sale boolean DEFAULT false;
  END IF;
END $$;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_new ON products(is_new) WHERE is_new = true;
CREATE INDEX IF NOT EXISTS idx_products_sale ON products(is_sale) WHERE is_sale = true;

-- Add updated_at trigger for products if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_products_updated_at') THEN
    CREATE TRIGGER trigger_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
