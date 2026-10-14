-- ============================================================
-- SENSEN ACCESSORIES - 01_boutique_schema.sql
-- ============================================================
-- Run FIRST in the Supabase SQL editor.
-- Every object is prefixed with `boutique_` so this project can
-- share the same Supabase database with another project.
-- The admin table also carries the `_sensen` suffix so the two
-- projects never share administrators.
-- ============================================================

-- ============================================
-- HELPER: updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION boutique_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORE SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_store_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name text DEFAULT 'Sensen Accessories',
  logo_url text,
  description text,
  contact_email text,
  contact_phone text,
  whatsapp_number text,
  address text,
  currency text DEFAULT 'USD',
  -- checkout / paiement sou sit la (dezaktive pa defo - admin ka aktive l)
  checkout_enabled boolean DEFAULT false,
  -- livrezon
  delivery_enabled boolean DEFAULT true,
  pickup_enabled boolean DEFAULT true,
  pickup_address text,
  shipping_fee numeric DEFAULT 0,
  free_shipping_threshold numeric,
  shipping_zones text,
  delivery_delay text DEFAULT '24 - 72 h',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

INSERT INTO boutique_store_settings (store_name, description, currency)
SELECT 'Sensen Accessories',
       'Accessoires de maison, decoration & studio de beaute.',
       'USD'
WHERE NOT EXISTS (SELECT 1 FROM boutique_store_settings);

DROP TRIGGER IF EXISTS trg_boutique_store_settings_updated_at ON boutique_store_settings;
CREATE TRIGGER trg_boutique_store_settings_updated_at
BEFORE UPDATE ON boutique_store_settings
FOR EACH ROW EXECUTE FUNCTION boutique_set_updated_at();

-- ============================================
-- ADMIN USERS (suffix _sensen : separe de lot projet la)
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_admin_users_sensen (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  role text DEFAULT 'admin' CHECK (role IN ('owner','admin','staff')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- CATEGORIES (vid nan koumansman - se admin ki kreye yo)
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  parent_id uuid REFERENCES boutique_categories(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  show_in_menu boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_boutique_categories_updated_at ON boutique_categories;
CREATE TRIGGER trg_boutique_categories_updated_at
BEFORE UPDATE ON boutique_categories
FOR EACH ROW EXECUTE FUNCTION boutique_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_boutique_categories_active ON boutique_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_boutique_categories_order ON boutique_categories(display_order);

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text,
  category_id uuid REFERENCES boutique_categories(id) ON DELETE SET NULL,
  description text,
  price numeric NOT NULL,
  sale_price numeric,
  stock integer DEFAULT 0,
  sku text,
  sizes text[] DEFAULT '{}',
  colors jsonb DEFAULT '[]',
  images text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_new boolean DEFAULT false,
  is_sale boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_boutique_products_updated_at ON boutique_products;
CREATE TRIGGER trg_boutique_products_updated_at
BEFORE UPDATE ON boutique_products
FOR EACH ROW EXECUTE FUNCTION boutique_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_boutique_products_category ON boutique_products(category_id);
CREATE INDEX IF NOT EXISTS idx_boutique_products_active ON boutique_products(is_active);
CREATE INDEX IF NOT EXISTS idx_boutique_products_order ON boutique_products(display_order);

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_product_variants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES boutique_products(id) ON DELETE CASCADE,
  color text,
  size text,
  sku text UNIQUE,
  stock integer DEFAULT 0,
  price_adjustment numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boutique_variants_product ON boutique_product_variants(product_id);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_customers (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  phone text,
  address text,
  city text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- CART ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_cart_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES boutique_products(id) ON DELETE CASCADE,
  quantity integer DEFAULT 1,
  size text,
  color text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id, size, color)
);

CREATE INDEX IF NOT EXISTS idx_boutique_cart_user ON boutique_cart_items(user_id);

-- ============================================
-- PAYMENT METHODS (admin nan ki kreye yo - paiement manuel)
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_payment_methods (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,                 -- ex: MonCash, NatCash, Sogebank
  type text NOT NULL DEFAULT 'mobile_money'
    CHECK (type IN ('mobile_money','bank_transfer','cash','card','other')),
  logo_url text,                      -- logo mode de paiement an
  account_name text,                  -- nom sou kont lan
  account_number text,                -- numero kont / telefon
  bank_name text,
  branch text,
  instructions text,                  -- esplikasyon pou kliyan an
  requires_proof boolean DEFAULT true, -- fok kliyan an upload prev
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_boutique_payment_methods_updated_at ON boutique_payment_methods;
CREATE TRIGGER trg_boutique_payment_methods_updated_at
BEFORE UPDATE ON boutique_payment_methods
FOR EACH ROW EXECUTE FUNCTION boutique_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_boutique_payment_methods_active ON boutique_payment_methods(is_active);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- kliyan
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,

  -- livrezon
  delivery_method text NOT NULL DEFAULT 'delivery'
    CHECK (delivery_method IN ('delivery','pickup')),
  delivery_address text,
  delivery_city text,
  delivery_zone text,
  delivery_status text NOT NULL DEFAULT 'not_started'
    CHECK (delivery_status IN ('not_started','preparing','ready_for_pickup','picked_up_by_courier','in_transit','out_for_delivery','delivered','failed','returned')),
  tracking_code text UNIQUE,
  courier_name text,
  courier_phone text,
  estimated_delivery_date date,
  delivered_at timestamptz,

  notes text,
  admin_note text,

  -- panye
  items jsonb NOT NULL,
  subtotal numeric NOT NULL,
  shipping_fee numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL,
  promo_code text,

  -- paiement manuel
  payment_method_id uuid REFERENCES boutique_payment_methods(id) ON DELETE SET NULL,
  payment_method_name text,
  payment_method_type text,
  payment_account_number text,
  payment_reference text,          -- numero transaction kliyan an bay
  payment_sender_name text,        -- non moun ki voye lajan an
  payment_proof_url text,          -- prev de paiement (upload)
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','awaiting_proof','proof_submitted','confirmed','rejected','refunded')),
  payment_confirmed_at timestamptz,
  payment_confirmed_by text,

  order_status text NOT NULL DEFAULT 'pending'
    CHECK (order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boutique_orders_user ON boutique_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_status ON boutique_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_payment_status ON boutique_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_delivery_status ON boutique_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_created ON boutique_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boutique_orders_tracking ON boutique_orders(tracking_code);

-- order number + tracking code generators
CREATE OR REPLACE FUNCTION boutique_generate_order_number()
RETURNS text AS $$
BEGIN
  RETURN 'SEN-' || TO_CHAR(now(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 6));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION boutique_generate_tracking_code()
RETURNS text AS $$
BEGIN
  RETURN 'TRK-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', ''), 1, 10));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION boutique_before_insert_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := boutique_generate_order_number();
  END IF;
  IF NEW.tracking_code IS NULL OR NEW.tracking_code = '' THEN
    NEW.tracking_code := boutique_generate_tracking_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_boutique_orders_before_insert ON boutique_orders;
CREATE TRIGGER trg_boutique_orders_before_insert
BEFORE INSERT ON boutique_orders
FOR EACH ROW EXECUTE FUNCTION boutique_before_insert_order();

DROP TRIGGER IF EXISTS trg_boutique_orders_updated_at ON boutique_orders;
CREATE TRIGGER trg_boutique_orders_updated_at
BEFORE UPDATE ON boutique_orders
FOR EACH ROW EXECUTE FUNCTION boutique_set_updated_at();

-- ============================================
-- PAYMENT PROOFS (kliyan an ka voye plizye prev)
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_payment_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES boutique_orders(id) ON DELETE CASCADE,
  payment_method_id uuid REFERENCES boutique_payment_methods(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  amount numeric,
  reference text,
  sender_name text,
  sender_phone text,
  paid_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boutique_proofs_order ON boutique_payment_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_boutique_proofs_status ON boutique_payment_proofs(status);

-- ============================================
-- DELIVERY TRACKING EVENTS (suivi livrezon)
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_order_tracking (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES boutique_orders(id) ON DELETE CASCADE,
  status text NOT NULL
    CHECK (status IN ('order_placed','payment_confirmed','preparing','ready_for_pickup','picked_up_by_courier','in_transit','out_for_delivery','delivered','failed','returned','cancelled')),
  title text,
  note text,
  location text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boutique_tracking_order ON boutique_order_tracking(order_id, created_at);

-- premye evenman tracking otomatikman lè yon commande kreye
CREATE OR REPLACE FUNCTION boutique_after_insert_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO boutique_order_tracking (order_id, status, title, note, created_by)
  VALUES (NEW.id, 'order_placed', 'Commande recue',
          'Commande ' || NEW.order_number || ' enregistree.', 'system');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_boutique_orders_after_insert ON boutique_orders;
CREATE TRIGGER trg_boutique_orders_after_insert
AFTER INSERT ON boutique_orders
FOR EACH ROW EXECUTE FUNCTION boutique_after_insert_order();

-- sinkronize delivery_status / order_status ak yon nouvo evenman tracking
CREATE OR REPLACE FUNCTION boutique_after_insert_tracking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('preparing','ready_for_pickup','picked_up_by_courier','in_transit','out_for_delivery','delivered','failed','returned') THEN
    UPDATE boutique_orders
       SET delivery_status = NEW.status,
           order_status = CASE
             WHEN NEW.status = 'delivered' THEN 'delivered'
             WHEN NEW.status IN ('in_transit','out_for_delivery','picked_up_by_courier') THEN 'shipped'
             WHEN NEW.status IN ('preparing','ready_for_pickup') THEN 'processing'
             ELSE order_status
           END,
           delivered_at = CASE WHEN NEW.status = 'delivered' THEN now() ELSE delivered_at END
     WHERE id = NEW.order_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_boutique_tracking_after_insert ON boutique_order_tracking;
CREATE TRIGGER trg_boutique_tracking_after_insert
AFTER INSERT ON boutique_order_tracking
FOR EACH ROW EXECUTE FUNCTION boutique_after_insert_tracking();

-- ============================================
-- MESSAGES (live chat)
-- ============================================
CREATE TABLE IF NOT EXISTS boutique_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('client','admin')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boutique_messages_user ON boutique_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_boutique_messages_created ON boutique_messages(created_at DESC);

DROP TRIGGER IF EXISTS trg_boutique_messages_updated_at ON boutique_messages;
CREATE TRIGGER trg_boutique_messages_updated_at
BEFORE UPDATE ON boutique_messages
FOR EACH ROW EXECUTE FUNCTION boutique_set_updated_at();

-- ============================================
-- PUBLIC TRACKING FUNCTION (suivi ak tracking_code)
-- ============================================
CREATE OR REPLACE FUNCTION boutique_track_order(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order boutique_orders;
  v_events jsonb;
BEGIN
  SELECT * INTO v_order FROM boutique_orders
   WHERE tracking_code = p_code OR order_number = p_code
   LIMIT 1;

  IF v_order.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'status', t.status, 'title', t.title, 'note', t.note,
           'location', t.location, 'created_at', t.created_at
         ) ORDER BY t.created_at), '[]'::jsonb)
    INTO v_events
    FROM boutique_order_tracking t
   WHERE t.order_id = v_order.id;

  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'tracking_code', v_order.tracking_code,
    'delivery_method', v_order.delivery_method,
    'delivery_status', v_order.delivery_status,
    'order_status', v_order.order_status,
    'payment_status', v_order.payment_status,
    'courier_name', v_order.courier_name,
    'estimated_delivery_date', v_order.estimated_delivery_date,
    'delivered_at', v_order.delivered_at,
    'events', v_events
  );
END;
$$;
