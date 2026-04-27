-- 01_schema.sql
-- Run this first in Supabase SQL editor
-- Creates all tables, triggers, and functions for the luxury boutique

-- ============================================
-- STORE SETTINGS TABLE
-- ============================================
CREATE TABLE store_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text DEFAULT 'NOM DU STORE',
  logo_url text,
  description text,
  contact_email text,
  moncash_number text,
  natcash_number text,
  bank_details jsonb DEFAULT '{}',
  cod_enabled boolean DEFAULT true,
  shipping_fee numeric DEFAULT 0,
  free_shipping_threshold numeric,
  shipping_zones text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Insert default store settings
INSERT INTO store_settings (store_name) VALUES ('NOM DU STORE');

-- ============================================
-- ADMIN USERS TABLE
-- ============================================
CREATE TABLE admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamp DEFAULT now()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('vetements','parfums','accessoires','nouveautes','soldes')),
  description text,
  price numeric NOT NULL,
  sale_price numeric,
  stock integer DEFAULT 0,
  sizes text[],
  colors jsonb DEFAULT '[]',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_sale boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================
-- CUSTOMERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE customers (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  full_name text,
  phone text,
  address text,
  city text,
  created_at timestamp DEFAULT now()
);

-- ============================================
-- CART ITEMS TABLE
-- ============================================
CREATE TABLE cart_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  size text,
  color text,
  created_at timestamp DEFAULT now(),
  UNIQUE(user_id, product_id, size, color)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  delivery_address text,
  delivery_city text,
  notes text,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric DEFAULT 0,
  total numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('moncash','natcash','bank_transfer','cod')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending','confirmed','failed')),
  order_status text DEFAULT 'pending' CHECK (order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  promo_code text,
  discount numeric DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================
-- TRIGGER FUNCTIONS
-- ============================================

-- Order number generator function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
END;
$$ LANGUAGE plpgsql;

-- Auto-generate order number trigger
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables that need it
CREATE TRIGGER trigger_products_updated_at 
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_orders_updated_at 
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_settings_updated_at 
BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  color text,
  size text,
  sku text UNIQUE,
  stock integer DEFAULT 0,
  price_adjustment numeric DEFAULT 0,
  created_at timestamp DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_display_order ON products(display_order);
CREATE INDEX idx_cart_user_id ON cart_items(user_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
