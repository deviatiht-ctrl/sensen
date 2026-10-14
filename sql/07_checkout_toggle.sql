-- ============================================================
-- SENSEN ACCESSORIES - 07_checkout_toggle.sql
-- ============================================================
-- Ajoute la colonne `checkout_enabled` a boutique_store_settings.
-- Quand false (defaut) : les clients peuvent voir les produits et
-- le panier, mais ne peuvent PAS passer de commande ni payer.
-- L'admin l'active dans Parametres > Boutique en ligne.
-- Idempotent : ou ka roule l plizye fwa.
-- ============================================================

ALTER TABLE boutique_store_settings
  ADD COLUMN IF NOT EXISTS checkout_enabled boolean DEFAULT false;
