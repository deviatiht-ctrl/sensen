-- ============================================================
-- SENSEN ACCESSORIES - 05_boutique_seed.sql
-- ============================================================
-- Run FIFTH (opsyonel). Sa a se demo katalog la.
-- Tab boutique_categories rete VID apre 01_boutique_schema.sql :
-- se admin nan ki kreye kategori yo epi yo monte otomatikman nan
-- paj yo. Fichye sa a jis pre-ranpli boutik la ak yon katalog
-- konplè pou Sensen Accessories (foto reyèl Unsplash).
-- Tout INSERT yo idempotan (ou ka roule l plizyè fwa).
-- ============================================================

-- ============================================
-- STORE SETTINGS
-- ============================================
UPDATE boutique_store_settings SET
  store_name = 'Sensen Accessories',
  description = 'Sensen Accessories - accessoires de maison, decoration interieure, studio de beaute. Canapes, chaises, plantes artificielles, lumieres de plafond, miroirs, tapis et plus.',
  currency = 'USD',
  delivery_enabled = true,
  pickup_enabled = true,
  shipping_fee = 5,
  free_shipping_threshold = 250,
  delivery_delay = '24 - 72 h';

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO boutique_categories (name, slug, description, image_url, display_order, is_active, show_in_menu)
SELECT v.name, v.slug, v.description, v.image_url, v.ord, true, true
FROM (VALUES
  ('Studio de Beaute', 'studio-de-beaute',
   'Tout sa yon studio de beaute bezwen : chez salon, miwa limye, tab makyaj, ring light.',
   'https://images.unsplash.com/photo-1637777277435-3c44f82fd0c9?auto=format&fit=crop&w=1200&q=80', 1),
  ('Canapes', 'canapes',
   'Canapes 2 et 3 places, canapes d''angle et banquettes pour le salon.',
   'https://images.unsplash.com/photo-1775029676739-86443af4010d?auto=format&fit=crop&w=1200&q=80', 2),
  ('Chaises & Fauteuils', 'chaises-fauteuils',
   'Fauteuils, chaises de salle a manger et chaises d''appoint.',
   'https://images.unsplash.com/photo-1758915753395-a5dddea1d813?auto=format&fit=crop&w=1200&q=80', 3),
  ('Tables & Consoles', 'tables-consoles',
   'Tables basses, consoles d''entree et tables d''appoint.',
   'https://images.unsplash.com/photo-1765766599670-a625d0fef258?auto=format&fit=crop&w=1200&q=80', 4),
  ('Plantes Artificielles', 'plantes-artificielles',
   'Plantes et fleurs artificielles avec cache-pots, sans entretien.',
   'https://images.unsplash.com/photo-1762755647813-017e128a4ba0?auto=format&fit=crop&w=1200&q=80', 5),
  ('Lumieres & Plafonniers', 'lumieres-plafond',
   'Lustres, plafonniers, suspensions et lampes decoratives.',
   'https://images.unsplash.com/photo-1763705859079-29c5cc0576bc?auto=format&fit=crop&w=1200&q=80', 6),
  ('Miroirs', 'miroirs',
   'Miroirs ronds, miroirs sur pied et miroirs lumineux.',
   'https://images.unsplash.com/photo-1736071970376-7392ff3ae6e8?auto=format&fit=crop&w=1200&q=80', 7),
  ('Tapis', 'tapis',
   'Tapis de salon, tapis de couloir et tapis d''entree.',
   'https://images.unsplash.com/photo-1722248242698-fbe7e3fa0391?auto=format&fit=crop&w=1200&q=80', 8),
  ('Rideaux', 'rideaux',
   'Rideaux en lin, voilages et tringles.',
   'https://images.unsplash.com/photo-1754613411942-f2dee061753b?auto=format&fit=crop&w=1200&q=80', 9),
  ('Vases & Cache-pots', 'vases-cache-pots',
   'Vases en ceramique, cache-pots et objets de decoration.',
   'https://images.unsplash.com/photo-1771967350550-e7d72e44a48c?auto=format&fit=crop&w=1200&q=80', 10),
  ('Decoration Murale', 'decoration-murale',
   'Cadres, toiles, affiches et compositions murales.',
   'https://images.unsplash.com/photo-1762398948187-63c225877451?auto=format&fit=crop&w=1200&q=80', 11),
  ('Rangement & Paniers', 'rangement-paniers',
   'Paniers tresses, boites de rangement et organisateurs.',
   'https://images.unsplash.com/photo-1777566131330-8f2c8b497847?auto=format&fit=crop&w=1200&q=80', 12),
  ('Art de la Table', 'art-de-la-table',
   'Assiettes, bols en ceramique, couverts et decoration de table.',
   'https://images.unsplash.com/photo-1489421234833-3e44ab2f5470?auto=format&fit=crop&w=1200&q=80', 13)
) AS v(name, slug, description, image_url, ord)
WHERE NOT EXISTS (SELECT 1 FROM boutique_categories c WHERE c.slug = v.slug);

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO boutique_products
  (name, slug, category_id, description, price, sale_price, stock, images,
   is_active, is_featured, is_new, is_sale, display_order)
SELECT v.name, v.slug, c.id, v.description,
       v.price::numeric, v.sale_price::numeric, v.stock::int, v.images::text[],
       v.active, v.featured, v.is_new, (v.sale_price IS NOT NULL), v.ord
FROM (VALUES
  -- ===== STUDIO DE BEAUTE =====
  ('Chaise de salon professionnelle', 'chaise-salon-pro', 'studio-de-beaute',
   'Chaise de salon en similicuir avec base hydraulique, dossier inclinable. Idéale pour coiffure et maquillage.',
   249, NULL, 6,
   ARRAY['https://images.unsplash.com/photo-1637777277435-3c44f82fd0c9?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Station de maquillage lumineuse', 'station-maquillage-lumineuse', 'studio-de-beaute',
   'Table de maquillage avec miroir a LED dimmable, tiroirs de rangement et tabouret assorti.',
   389, 349, 4,
   ARRAY['https://images.unsplash.com/photo-1758613653823-5baa7dd8073e?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 2),
  ('Ring light studio 18 pouces', 'ring-light-18', 'studio-de-beaute',
   'Anneau lumineux 18" avec trepied, 3 temperatures de couleur et support telephone. Parfait pour contenu beaute.',
   119, NULL, 12,
   ARRAY['https://images.unsplash.com/photo-1731514740777-6476aae2accf?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 3),

  -- ===== CANAPES =====
  ('Canape 3 places beige Sensen', 'canape-3-places-beige', 'canapes',
   'Canape 3 places en tissu beige, coussins moelleux et pieds en bois massif.',
   899, 799, 3,
   ARRAY['https://images.unsplash.com/photo-1775029676739-86443af4010d?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Canape 2 places minimaliste', 'canape-2-places-minimaliste', 'canapes',
   'Canape compact 2 places, lignes epurees, tissu anti-taches.',
   649, NULL, 5,
   ARRAY['https://images.unsplash.com/photo-1760611656185-57a618917619?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 2),

  -- ===== CHAISES & FAUTEUILS =====
  ('Fauteuil moderne avec coussin', 'fauteuil-moderne-coussin', 'chaises-fauteuils',
   'Fauteuil confort avec coussin d''appoint, structure metal et assise rembourree.',
   279, NULL, 8,
   ARRAY['https://images.unsplash.com/photo-1758915753395-a5dddea1d813?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Fauteuil lounge cocooning', 'fauteuil-lounge-cocooning', 'chaises-fauteuils',
   'Fauteuil lounge enveloppant, idéal coin lecture, tissu boucle.',
   319, 289, 6,
   ARRAY['https://images.unsplash.com/photo-1768198566890-c093ec87a972?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 2),

  -- ===== TABLES & CONSOLES =====
  ('Console d''entree marbre & metal', 'console-entree-marbre', 'tables-consoles',
   'Console d''entree plateau effet marbre, pietement metal dore.',
   399, NULL, 4,
   ARRAY['https://images.unsplash.com/photo-1765766599670-a625d0fef258?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Table basse salon centrale', 'table-basse-salon', 'tables-consoles',
   'Table basse de salon, finition bois clair, resistante et facile a nettoyer.',
   229, NULL, 7,
   ARRAY['https://images.unsplash.com/photo-1769812343774-3673ecca0c7b?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 2),

  -- ===== PLANTES ARTIFICIELLES =====
  ('Monstera artificiel 120 cm', 'monstera-artificiel-120', 'plantes-artificielles',
   'Monstera artificiel 120 cm avec cache-pot terracotta. Rendu tres realiste, zero entretien.',
   89, 75, 15,
   ARRAY['https://images.unsplash.com/photo-1762755647813-017e128a4ba0?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Monstera variegata pot blanc', 'monstera-variegata-pot-blanc', 'plantes-artificielles',
   'Monstera variegata artificiel en pot ceramique blanc, hauteur 90 cm.',
   79, NULL, 18,
   ARRAY['https://images.unsplash.com/photo-1750341005578-210e78d64c1d?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 2),
  ('Plante verte de table', 'plante-verte-de-table', 'plantes-artificielles',
   'Petite plante artificielle pour table, bureau ou console. Pot inclus.',
   34, NULL, 30,
   ARRAY['https://images.unsplash.com/photo-1598827691375-140045b69f5d?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 3),
  ('Feuillage tropical XL', 'feuillage-tropical-xl', 'plantes-artificielles',
   'Grand feuillage tropical artificiel pour coin salon ou vitrine.',
   109, NULL, 9,
   ARRAY['https://images.unsplash.com/photo-1774542875422-5b825fa05024?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 4),

  -- ===== LUMIERES & PLAFONNIERS =====
  ('Suspension moderne plafond', 'suspension-moderne-plafond', 'lumieres-plafond',
   'Suspension design pour plafond, finition mate, douille E27.',
   129, NULL, 10,
   ARRAY['https://images.unsplash.com/photo-1763705859079-29c5cc0576bc?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Trio de suspensions chaudes', 'trio-suspensions-chaudes', 'lumieres-plafond',
   'Set de 3 suspensions lumiere chaude, parfait au-dessus d''un ilot ou d''une table.',
   189, 165, 8,
   ARRAY['https://images.unsplash.com/photo-1771532447019-7eb5220320c7?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 2),
  ('Lampe suspendue laiton', 'lampe-suspendue-laiton', 'lumieres-plafond',
   'Lampe suspendue finition laiton, style vintage chic.',
   149, NULL, 11,
   ARRAY['https://images.unsplash.com/photo-1571715543521-f7f53c60cc2d?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 3),
  ('Lustre decoratif salon', 'lustre-decoratif-salon', 'lumieres-plafond',
   'Lustre decoratif pour salon ou salle a manger, effet cristal.',
   459, NULL, 3,
   ARRAY['https://images.unsplash.com/photo-1771148886930-01cd06ddb38f?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 4),

  -- ===== MIROIRS =====
  ('Miroir rond mural 80 cm', 'miroir-rond-80', 'miroirs',
   'Miroir rond mural 80 cm, cadre fin, fixation murale incluse.',
   139, NULL, 12,
   ARRAY['https://images.unsplash.com/photo-1736071970376-7392ff3ae6e8?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Miroir rond hublot 60 cm', 'miroir-hublot-60', 'miroirs',
   'Miroir hublot 60 cm, style epure pour entree ou salle de bain.',
   99, 85, 14,
   ARRAY['https://images.unsplash.com/photo-1683746531526-3bca2bc901b8?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 2),
  ('Miroir deco coin lumiere', 'miroir-deco-coin-lumiere', 'miroirs',
   'Miroir decoratif pour coin lumineux, effet agrandissement d''espace.',
   119, NULL, 10,
   ARRAY['https://images.unsplash.com/photo-1780139815926-ea90709b2010?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 3),

  -- ===== TAPIS =====
  ('Tapis de salon tisse', 'tapis-salon-tisse', 'tapis',
   'Tapis de salon tisse, 160x230 cm, doux et resistant.',
   199, 179, 7,
   ARRAY['https://images.unsplash.com/photo-1722248242698-fbe7e3fa0391?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Tapis geometrique coton', 'tapis-geometrique-coton', 'tapis',
   'Tapis en coton motif geometrique, reversible, lavable.',
   129, NULL, 12,
   ARRAY['https://images.unsplash.com/photo-1767855244529-e354ae49fb49?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 2),

  -- ===== RIDEAUX =====
  ('Rideaux en lin naturel (paire)', 'rideaux-lin-naturel', 'rideaux',
   'Paire de rideaux en lin naturel 140x260 cm, tombee elegante.',
   89, NULL, 16,
   ARRAY['https://images.unsplash.com/photo-1754613411942-f2dee061753b?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Voilage blanc translucide', 'voilage-blanc-translucide', 'rideaux',
   'Voilage blanc translucide qui filtre la lumiere avec douceur.',
   49, 39, 22,
   ARRAY['https://images.unsplash.com/photo-1764422097759-1fa737c50c51?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 2),
  ('Rideau occultant couloir', 'rideau-occultant-couloir', 'rideaux',
   'Rideau occultant pour couloir ou chambre, isolation thermique.',
   69, NULL, 14,
   ARRAY['https://images.unsplash.com/photo-1759692071732-9ba8ac519f1e?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 3),

  -- ===== VASES & CACHE-POTS =====
  ('Set de 3 vases ceramique', 'set-3-vases-ceramique', 'vases-cache-pots',
   'Set de 3 vases en ceramique de tailles differentes, tons terreux.',
   59, NULL, 20,
   ARRAY['https://images.unsplash.com/photo-1771967350550-e7d72e44a48c?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Collection vases artisanaux', 'collection-vases-artisanaux', 'vases-cache-pots',
   'Vases artisanaux faits main, finition mate, ideal etagere ou console.',
   79, 69, 13,
   ARRAY['https://images.unsplash.com/photo-1724709166120-f4efdd5dba07?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 2),

  -- ===== DECORATION MURALE =====
  ('Composition murale 6 cadres', 'composition-murale-6-cadres', 'decoration-murale',
   'Set de 6 cadres assortis avec affiches abstraites incluses.',
   149, NULL, 9,
   ARRAY['https://images.unsplash.com/photo-1762398948187-63c225877451?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Toile abstraite grand format', 'toile-abstraite-grand-format', 'decoration-murale',
   'Toile abstraite grand format sur chassis bois, pret a accrocher.',
   189, 159, 6,
   ARRAY['https://images.unsplash.com/photo-1771786035305-134b928d0684?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 2),
  ('Duo de cadres deco', 'duo-cadres-deco', 'decoration-murale',
   'Duo de cadres decoratifs, style minimaliste chaleureux.',
   89, NULL, 15,
   ARRAY['https://images.unsplash.com/photo-1758718036458-a7e88219dbd4?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 3),

  -- ===== RANGEMENT & PANIERS =====
  ('Panier tresse rangement', 'panier-tresse-rangement', 'rangement-paniers',
   'Panier tresse a la main, parfait pour linge, jouets ou plantes.',
   45, NULL, 25,
   ARRAY['https://images.unsplash.com/photo-1777566131330-8f2c8b497847?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Set de paniers decoratifs', 'set-paniers-decoratifs', 'rangement-paniers',
   'Set de paniers decoratifs de tailles differentes en fibres naturelles.',
   79, 65, 14,
   ARRAY['https://images.unsplash.com/photo-1776813191020-c3dbd782e34b?auto=format&fit=crop&w=1200&q=80'],
   true, false, false, 2),
  ('Paniers de rangement placard', 'paniers-rangement-placard', 'rangement-paniers',
   'Paniers empilables pour placard et etagere, finition naturelle.',
   39, NULL, 28,
   ARRAY['https://images.unsplash.com/photo-1635681598234-49b6e2c53e01?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 3),

  -- ===== ART DE LA TABLE =====
  ('Service de table 12 pieces', 'service-table-12-pieces', 'art-de-la-table',
   'Service de table 12 pieces en ceramique blanche, passe au lave-vaisselle.',
   129, NULL, 10,
   ARRAY['https://images.unsplash.com/photo-1489421234833-3e44ab2f5470?auto=format&fit=crop&w=1200&q=80'],
   true, true, false, 1),
  ('Set decoration de table evenement', 'set-decoration-table-evenement', 'art-de-la-table',
   'Set complet de decoration de table pour evenements : chemins, bougeoirs, verrerie.',
   99, 85, 12,
   ARRAY['https://images.unsplash.com/photo-1773005695245-348091f9be27?auto=format&fit=crop&w=1200&q=80'],
   true, false, true, 2)
) AS v(name, slug, cat_slug, description, price, sale_price, stock, images, active, featured, is_new, ord)
JOIN boutique_categories c ON c.slug = v.cat_slug
WHERE NOT EXISTS (SELECT 1 FROM boutique_products p WHERE p.slug = v.slug);

-- ============================================
-- PAYMENT METHODS (egzanp - admin nan ka modifye yo)
-- ============================================
INSERT INTO boutique_payment_methods
  (name, type, account_name, account_number, instructions, requires_proof, is_active, display_order)
SELECT v.name, v.type, v.account_name, v.account_number, v.instructions, v.requires_proof, true, v.ord
FROM (VALUES
  ('MonCash', 'mobile_money', 'Sensen Accessories', '+509 0000 0000',
   'Voye montan total la sou nimewo MonCash sa a, epi upload kaptire tranzaksyon an (prev de paiement).',
   true, 1),
  ('NatCash', 'mobile_money', 'Sensen Accessories', '+509 0000 0000',
   'Voye montan total la sou nimewo NatCash sa a, epi upload kaptire tranzaksyon an.',
   true, 2),
  ('Virement bancaire', 'bank_transfer', 'Sensen Accessories', '000-000000-0',
   'Fe depo oswa virement nan kont bank la epi upload photo bordereau a.',
   true, 3),
  ('Paiement a la livraison', 'cash', 'Sensen Accessories', NULL,
   'Ou peye kach lè livrezon an rive. Pa gen prev pou upload.',
   false, 4)
) AS v(name, type, account_name, account_number, instructions, requires_proof, ord)
WHERE NOT EXISTS (SELECT 1 FROM boutique_payment_methods m WHERE m.name = v.name);
