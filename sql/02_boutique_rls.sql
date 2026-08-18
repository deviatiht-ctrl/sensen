-- ============================================================
-- SENSEN ACCESSORIES - 02_boutique_rls.sql
-- ============================================================
-- Run SECOND. Enables RLS + policies for every boutique_ table.
-- Admin check uses a SECURITY DEFINER function to avoid recursion.
-- ============================================================

-- ============================================
-- ADMIN CHECK FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION boutique_is_admin(user_email text DEFAULT auth.email())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM boutique_admin_users_sensen
     WHERE lower(email) = lower(user_email)
       AND is_active = true
  );
$$;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE boutique_store_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_admin_users_sensen ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_products           ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_product_variants   ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_customers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_cart_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_payment_methods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_orders             ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_payment_proofs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_order_tracking     ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutique_messages           ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STORE SETTINGS
-- ============================================
DROP POLICY IF EXISTS boutique_settings_read      ON boutique_store_settings;
DROP POLICY IF EXISTS boutique_settings_admin_all ON boutique_store_settings;

CREATE POLICY boutique_settings_read ON boutique_store_settings
  FOR SELECT USING (true);

CREATE POLICY boutique_settings_admin_all ON boutique_store_settings
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- ADMIN USERS
-- ============================================
DROP POLICY IF EXISTS boutique_admins_admin_all ON boutique_admin_users_sensen;

CREATE POLICY boutique_admins_admin_all ON boutique_admin_users_sensen
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- Chak moun ki konekte ka verifye si se li menm ki admin (pou navbar / guard)
DROP POLICY IF EXISTS boutique_admins_self_read ON boutique_admin_users_sensen;
CREATE POLICY boutique_admins_self_read ON boutique_admin_users_sensen
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.email()));

-- ============================================
-- CATEGORIES
-- ============================================
DROP POLICY IF EXISTS boutique_categories_public_read ON boutique_categories;
DROP POLICY IF EXISTS boutique_categories_admin_read  ON boutique_categories;
DROP POLICY IF EXISTS boutique_categories_admin_all   ON boutique_categories;

CREATE POLICY boutique_categories_public_read ON boutique_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY boutique_categories_admin_read ON boutique_categories
  FOR SELECT TO authenticated USING (boutique_is_admin(auth.email()));

CREATE POLICY boutique_categories_admin_all ON boutique_categories
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- PRODUCTS
-- ============================================
DROP POLICY IF EXISTS boutique_products_public_read ON boutique_products;
DROP POLICY IF EXISTS boutique_products_admin_read  ON boutique_products;
DROP POLICY IF EXISTS boutique_products_admin_all   ON boutique_products;

CREATE POLICY boutique_products_public_read ON boutique_products
  FOR SELECT USING (is_active = true);

CREATE POLICY boutique_products_admin_read ON boutique_products
  FOR SELECT TO authenticated USING (boutique_is_admin(auth.email()));

CREATE POLICY boutique_products_admin_all ON boutique_products
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- PRODUCT VARIANTS
-- ============================================
DROP POLICY IF EXISTS boutique_variants_public_read ON boutique_product_variants;
DROP POLICY IF EXISTS boutique_variants_admin_all   ON boutique_product_variants;

CREATE POLICY boutique_variants_public_read ON boutique_product_variants
  FOR SELECT USING (true);

CREATE POLICY boutique_variants_admin_all ON boutique_product_variants
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- CUSTOMERS
-- ============================================
DROP POLICY IF EXISTS boutique_customers_read   ON boutique_customers;
DROP POLICY IF EXISTS boutique_customers_insert ON boutique_customers;
DROP POLICY IF EXISTS boutique_customers_update ON boutique_customers;

CREATE POLICY boutique_customers_read ON boutique_customers
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR boutique_is_admin(auth.email()));

CREATE POLICY boutique_customers_insert ON boutique_customers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY boutique_customers_update ON boutique_customers
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR boutique_is_admin(auth.email()))
  WITH CHECK (auth.uid() = id OR boutique_is_admin(auth.email()));

-- ============================================
-- CART ITEMS
-- ============================================
DROP POLICY IF EXISTS boutique_cart_own ON boutique_cart_items;

CREATE POLICY boutique_cart_own ON boutique_cart_items
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PAYMENT METHODS
-- ============================================
DROP POLICY IF EXISTS boutique_payment_methods_public_read ON boutique_payment_methods;
DROP POLICY IF EXISTS boutique_payment_methods_admin_read  ON boutique_payment_methods;
DROP POLICY IF EXISTS boutique_payment_methods_admin_all   ON boutique_payment_methods;

CREATE POLICY boutique_payment_methods_public_read ON boutique_payment_methods
  FOR SELECT USING (is_active = true);

CREATE POLICY boutique_payment_methods_admin_read ON boutique_payment_methods
  FOR SELECT TO authenticated USING (boutique_is_admin(auth.email()));

CREATE POLICY boutique_payment_methods_admin_all ON boutique_payment_methods
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- ORDERS
-- ============================================
DROP POLICY IF EXISTS boutique_orders_read         ON boutique_orders;
DROP POLICY IF EXISTS boutique_orders_insert       ON boutique_orders;
DROP POLICY IF EXISTS boutique_orders_admin_update ON boutique_orders;
DROP POLICY IF EXISTS boutique_orders_own_update   ON boutique_orders;
DROP POLICY IF EXISTS boutique_orders_admin_delete ON boutique_orders;

CREATE POLICY boutique_orders_read ON boutique_orders
  FOR SELECT USING (auth.uid() = user_id OR boutique_is_admin(auth.email()));

-- Kliyan konekte OSWA vizite (guest checkout) ka kreye yon commande
CREATE POLICY boutique_orders_insert ON boutique_orders
  FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Kliyan an ka mete prev de paiement sou pwòp commande li
CREATE POLICY boutique_orders_own_update ON boutique_orders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY boutique_orders_admin_update ON boutique_orders
  FOR UPDATE TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

CREATE POLICY boutique_orders_admin_delete ON boutique_orders
  FOR DELETE TO authenticated USING (boutique_is_admin(auth.email()));

-- ============================================
-- PAYMENT PROOFS
-- ============================================
DROP POLICY IF EXISTS boutique_proofs_read        ON boutique_payment_proofs;
DROP POLICY IF EXISTS boutique_proofs_insert      ON boutique_payment_proofs;
DROP POLICY IF EXISTS boutique_proofs_admin_write ON boutique_payment_proofs;

CREATE POLICY boutique_proofs_read ON boutique_payment_proofs
  FOR SELECT USING (
    boutique_is_admin(auth.email())
    OR EXISTS (
      SELECT 1 FROM boutique_orders o
       WHERE o.id = boutique_payment_proofs.order_id
         AND o.user_id = auth.uid()
    )
  );

-- Nenpòt kliyan (menm guest) ka voye prev pou commande li fèk kreye
CREATE POLICY boutique_proofs_insert ON boutique_payment_proofs
  FOR INSERT WITH CHECK (order_id IS NOT NULL);

CREATE POLICY boutique_proofs_admin_write ON boutique_payment_proofs
  FOR UPDATE TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- ORDER TRACKING
-- ============================================
DROP POLICY IF EXISTS boutique_tracking_read      ON boutique_order_tracking;
DROP POLICY IF EXISTS boutique_tracking_admin_all ON boutique_order_tracking;

CREATE POLICY boutique_tracking_read ON boutique_order_tracking
  FOR SELECT USING (
    boutique_is_admin(auth.email())
    OR EXISTS (
      SELECT 1 FROM boutique_orders o
       WHERE o.id = boutique_order_tracking.order_id
         AND o.user_id = auth.uid()
    )
  );

CREATE POLICY boutique_tracking_admin_all ON boutique_order_tracking
  FOR ALL TO authenticated
  USING (boutique_is_admin(auth.email()))
  WITH CHECK (boutique_is_admin(auth.email()));

-- ============================================
-- MESSAGES
-- ============================================
DROP POLICY IF EXISTS boutique_messages_read         ON boutique_messages;
DROP POLICY IF EXISTS boutique_messages_client_write ON boutique_messages;
DROP POLICY IF EXISTS boutique_messages_admin_write  ON boutique_messages;
DROP POLICY IF EXISTS boutique_messages_update       ON boutique_messages;

CREATE POLICY boutique_messages_read ON boutique_messages
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR boutique_is_admin(auth.email()));

CREATE POLICY boutique_messages_client_write ON boutique_messages
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND sender = 'client');

CREATE POLICY boutique_messages_admin_write ON boutique_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender = 'admin' AND boutique_is_admin(auth.email()));

CREATE POLICY boutique_messages_update ON boutique_messages
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR boutique_is_admin(auth.email()))
  WITH CHECK (user_id = auth.uid() OR boutique_is_admin(auth.email()));

-- ============================================
-- UNREAD COUNT HELPER
-- ============================================
CREATE OR REPLACE FUNCTION boutique_unread_message_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int FROM boutique_messages
   WHERE user_id = p_user_id AND sender = 'admin' AND read = false;
$$;
