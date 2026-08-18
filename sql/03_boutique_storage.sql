-- ============================================================
-- SENSEN ACCESSORIES - 03_boutique_storage.sql
-- ============================================================
-- Run THIRD. Creates the storage buckets used by this project only.
--   boutique-products : foto pwodwi, logo boutik, logo mode paiement (piblik)
--   boutique-proofs   : prev de paiement kliyan yo upload (piblik-read, URL sekre)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('boutique-products', 'boutique-products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('boutique-proofs', 'boutique-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- BUCKET: boutique-products
-- ============================================
DROP POLICY IF EXISTS boutique_products_files_read   ON storage.objects;
DROP POLICY IF EXISTS boutique_products_files_insert ON storage.objects;
DROP POLICY IF EXISTS boutique_products_files_update ON storage.objects;
DROP POLICY IF EXISTS boutique_products_files_delete ON storage.objects;

CREATE POLICY boutique_products_files_read ON storage.objects
  FOR SELECT USING (bucket_id = 'boutique-products');

CREATE POLICY boutique_products_files_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'boutique-products' AND boutique_is_admin(auth.email()));

CREATE POLICY boutique_products_files_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'boutique-products' AND boutique_is_admin(auth.email()));

CREATE POLICY boutique_products_files_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'boutique-products' AND boutique_is_admin(auth.email()));

-- ============================================
-- BUCKET: boutique-proofs
-- ============================================
DROP POLICY IF EXISTS boutique_proofs_files_read   ON storage.objects;
DROP POLICY IF EXISTS boutique_proofs_files_insert ON storage.objects;
DROP POLICY IF EXISTS boutique_proofs_files_delete ON storage.objects;

CREATE POLICY boutique_proofs_files_read ON storage.objects
  FOR SELECT USING (bucket_id = 'boutique-proofs');

-- Nenpòt kliyan (menm san kont) ka upload prev de paiement li
CREATE POLICY boutique_proofs_files_insert ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'boutique-proofs');

CREATE POLICY boutique_proofs_files_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'boutique-proofs' AND boutique_is_admin(auth.email()));
