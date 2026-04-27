-- 05_seed_products.sql
-- Complete luxury boutique catalog with images
-- 50+ products with Unsplash image URLs

-- ============================================
-- SEED LUXURY PRODUCTS WITH IMAGES
-- ============================================

-- VÊTEMENTS (15 produits)
INSERT INTO products (name, category, description, price, stock, sizes, colors, images, is_active, is_featured) VALUES
('Robe Soie Noire Élégance', 'vetements', 'Robe longue en soie naturelle 100%, coupe fluide et élégante. Dos nu avec fermeture invisible. Parfaite pour les soirées galas et événements luxueux. Doublure satin.', 385, 15, ARRAY['XS','S','M','L','XL'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Rouge", "hex": "#8B0000"}]', ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true),

('Chemise Lin Blanc Cassé Premium', 'vetements', 'Chemise oversize en lin italien premium, légère et respirante. Coupe boxy contemporaine. Boutons nacre véritable. Fabriqué artisanalement en Toscane.', 165, 25, ARRAY['XS','S','M','L','XL','XXL'], '[{"name": "Blanc Cassé", "hex": "#F5F5DC"}, {"name": "Beige", "hex": "#D4A574"}]', ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'], true, false),

('Pantalon Tailleur Wide Leg Crème', 'vetements', 'Pantalon tailleur coupe wide leg en laine vierge mélangée. Taille haute ajustée, jambe extra-large. Doublure intérieure soie crêpe. Finitions main.', 245, 18, ARRAY['XS','S','M','L','XL'], '[{"name": "Crème", "hex": "#FFFDD0"}, {"name": "Camel", "hex": "#C19A6B"}]', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'], true, true),

('Blazer Structuré Noir Iconique', 'vetements', 'Blazer de forme architecturale, épaules marquées, boutonnage croisé. Tissu gabardine de laine stretch premium. Entièrement doublé soie. Confection française.', 420, 12, ARRAY['XS','S','M','L','XL'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Marine", "hex": "#1B1B3A"}]', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80','https://images.unsplash.com/photo-1594938298603-c8148c472f96?w=800&q=80'], true, true),

('Trench Beige Classique Premium', 'vetements', 'Trench iconique en gabardine de coton égyptien, imperméable naturel. Coupe intemporelle avec ceinture et raglan sleeves. Doublure coton amovible. 12 boutons corne.', 495, 10, ARRAY['XS','S','M','L','XL','XXL'], '[{"name": "Beige", "hex": "#C2B280"}, {"name": "Kaki", "hex": "#8B8B5E"}]', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80','https://images.unsplash.com/photo-1544923246-77307dd628b9?w=800&q=80'], true, true),

('Robe Cocktail Rose Poudré', 'vetements', 'Robe cocktail mi-longue en crêpe de Chine. Décolleté cœur, jupe évasée. Doublure soie. Idéale pour cocktails et dîners romantiques.', 295, 20, ARRAY['XS','S','M','L','XL'], '[{"name": "Rose Poudré", "hex": "#E8C4C4"}, {"name": "Blush", "hex": "#DE5D83"}]', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, false),

('Pull Cachemire Col V Gris', 'vetements', 'Pull en cachemire mongol grade A, 2 fils. Coupe relaxée, col V profond. Toucher ultra-doux et chaleureux. Différents coloris disponibles.', 325, 22, ARRAY['XS','S','M','L','XL','XXL'], '[{"name": "Gris", "hex": "#808080"}, {"name": "Beige", "hex": "#D4A574"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80','https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'], true, true),

('Jupe Midi Plissée Dorée', 'vetements', 'Jupe midi plissée lamée dorée. Effet métallisé subtil, taille élastiquée. Doublure complète. Parfaite pour les fêtes de fin d''année.', 185, 16, ARRAY['XS','S','M','L','XL'], '[{"name": "Doré", "hex": "#D4AF37"}, {"name": "Argent", "hex": "#C0C0C0"}]', ARRAY['https://images.unsplash.com/photo-1583496661160-fb2053629817?w=800&q=80','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80'], true, false),

('Manteau Laine Double Face Camel', 'vetements', 'Manteau mi-long en laine double face. Coupe droite élégante, cols larges, poches plaquées. Sans doublure, finitions retournées. Poids léger mais chaud.', 585, 8, ARRAY['XS','S','M','L','XL'], '[{"name": "Camel", "hex": "#C19A6B"}, {"name": "Gris", "hex": "#808080"}]', ARRAY['https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80','https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80'], true, true),

('Top Satin Dos Nu Champagne', 'vetements', 'Top en satin de soie, coupe bustier avec dos nu profond. Fermeture crochet et zip. Élégant et sensuel pour les soirées.', 155, 30, ARRAY['XS','S','M','L'], '[{"name": "Champagne", "hex": "#F7E7CE"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, false),

('Veste Velours Côtelé Olive', 'vetements', 'Veste blazer en velours côtelé stretch. Coupe ajustée, un bouton. Épaulettes et poches passepoilées. Style rétro chic.', 265, 14, ARRAY['XS','S','M','L','XL'], '[{"name": "Olive", "hex": "#808000"}, {"name": "Bordeaux", "hex": "#800020"}]', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80','https://images.unsplash.com/photo-1594938298603-c8148c472f96?w=800&q=80'], true, false),

('Combinaison Satin Noir', 'vetements', 'Combinaison élégante en satin fluide. Col chemise, taille ceinturée, jambe wide. Effet cascadé au dos. Fermeture invisible.', 345, 12, ARRAY['XS','S','M','L','XL'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Ivoire", "hex": "#FFFFF0"}]', ARRAY['https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true),

('Short Tailleur Élégant', 'vetements', 'Short tailleur en crêpe de laine. Taille haute avec ceinture intégrée. Jambes amples, longueur mi-cuisse. Poches latérales.', 145, 25, ARRAY['XS','S','M','L','XL'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Blanc", "hex": "#FFFFFF"}, {"name": "Camel", "hex": "#C19A6B"}]', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'], true, false),

('Gilet Sans Manches Cachemire', 'vetements', 'Gilet oversize en cachemire fin. Col V profond, boutons dorés. Parfait en superposition sur une chemise ou un pull.', 225, 20, ARRAY['XS','S','M','L','XL'], '[{"name": "Grège", "hex": "#BEBEBE"}, {"name": "Camel", "hex": "#C19A6B"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80','https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'], true, false),

('Robe Maxi Fleurie Boho', 'vetements', 'Robe maxi longue en mousseline de soie imprimée fleurs. Décolleté V, manches ballons, taille smockée. Style bohème chic.', 235, 18, ARRAY['XS','S','M','L','XL'], '[{"name": "Multicolore", "hex": "#FF69B4"}]', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, false);

-- PARFUMS (10 produits)
INSERT INTO products (name, category, description, price, stock, colors, images, is_active, is_featured) VALUES
('Parfum N°01 — Oud & Rose Intense', 'parfums', 'Fragrance orientale luxueuse. Notes: bergamote sicilienne, rose damascena, oud de Laos, jasmin d''Égypte, musc blanc, vanille de Madagascar, santal d''Australie. 50ml Extrait de Parfum.', 245, 30, '[{"name": "Ambre", "hex": "#FFBF00"}]', ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80','https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80'], true, true),

('Parfum N°02 — Sel Marin & Vétiver', 'parfums', 'Fragrance aquatique unisexe sophistiquée. Notes: sel marin, concombre frais, vétiver d''Haïti, cèdre bleu du Texas, ambroxan. Fraîcheur iodée persistante. 75ml EDP.', 185, 25, '[{"name": "Bleu", "hex": "#0066CC"}]', ARRAY['https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80','https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'], true, false),

('Parfum N°03 — Iris Noir Prestige', 'parfums', 'Iris poudré sophistiqué et rare. Notes: iris de Florence, violette, cèdre de l''Atlas, ambre gris, ambrette. Sillage exceptionnel. 100ml EDP Edition Prestige.', 295, 15, '[{"name": "Violet", "hex": "#8B00FF"}]', ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80','https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'], true, true),

('Parfum N°04 — Ambre Oriental Doré', 'parfums', 'Ambre chaleureux et sensuel. Notes: ambre, benjoin du Laos, patchouli d''Indonésie, vanille de Madagascar, épices orientales. Soirée d''hiver parfaite. 50ml EDP.', 215, 20, '[{"name": "Or", "hex": "#D4AF37"}]', ARRAY['https://images.unsplash.com/photo-1547887538-047f814bfb64?w=800&q=80','https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80'], true, false),

('Parfum N°05 — Jasmin Nuit Blanc', 'parfums', 'Floral blanc nocturne enivrant. Notes: jasmin grandiflorum, tubéreuse, gardénia, musc blanc, bois de santal. Pure élégance féminine. 75ml EDP.', 195, 22, '[{"name": "Blanc", "hex": "#FFFFFF"}]', ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80','https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'], true, false),

('Parfum N°06 — Cuir & Épices', 'parfums', 'Cuir audacieux et épicé. Notes: cuir, cardamome, poivre noir, safran, cèdre, musc. Force et sophistication masculines. 100ml EDP.', 225, 18, '[{"name": "Cuir", "hex": "#8B4513"}]', ARRAY['https://images.unsplash.com/photo-1547887538-047f814bfb64?w=800&q=80','https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80'], true, true),

('Parfum N°07 — Thé Vert & Bergamote', 'parfums', 'Parfum frais et raffiné. Notes: thé vert japonais, bergamote de Calabre, néroli, bois blancs. Élégance discrète. 75ml EDP.', 165, 28, '[{"name": "Vert", "hex": "#228B22"}]', ARRAY['https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80','https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'], true, false),

('Parfum N°08 — Vanille Gourmande', 'parfums', 'Vanille délicieusement addictive. Notes: vanille de Tahiti, caramel au beurre salé, amande, musc. Confort et gourmandise. 50ml EDP.', 175, 25, '[{"name": "Beige", "hex": "#F5F5DC"}]', ARRAY['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80','https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80'], true, false),

('Parfum N°09 — Rose Velours', 'parfums', 'Rose veloutée et moderne. Notes: rose de mai, framboise, ambroxan, cashmeran. Rose contemporaine audacieuse. 75ml EDP.', 195, 20, '[{"name": "Rose", "hex": "#FF69B4"}]', ARRAY['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80','https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'], true, false),

('Parfum N°10 — Musc Blanc Pur', 'parfums', 'Musc pur et enveloppant. Notes: musc blanc, ambrette, iris, bois de cèdre. Clean et sensuel. 100ml EDP.', 185, 24, '[{"name": "Blanc", "hex": "#FFFFFF"}]', ARRAY['https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80','https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80'], true, false);

-- ACCESSOIRES (15 produits)
INSERT INTO products (name, category, description, price, stock, sizes, colors, images, is_active, is_featured) VALUES
('Sac Mini Cuir Quilté Noir', 'accessoires', 'Sac mini en cuir d''agneau matelassé. Chaîne dorée ajustable. Fermeture rabat magnétique. Intérieur cuir daim. 18x12x6cm.', 545, 12, NULL, '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Beige", "hex": "#F5F5DC"}]', ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80','https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'], true, true),

('Sac Cabas Cuir Cognac', 'accessoires', 'Cabas en cuir grainé italien. Anses courtes et longue bandoulière amovible. Fermeture zip. Intérieur compartimenté. 35x28x12cm.', 445, 15, NULL, '[{"name": "Cognac", "hex": "#9B4634"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80','https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'], true, true),

('Pochette Soirée Métallisée', 'accessoires', 'Pochette de soirée en cuir métallisé. Chaîne dorée amovible. Fermeture clic-clac. 24x14cm. Élégante et festive.', 185, 20, NULL, '[{"name": "Or", "hex": "#D4AF37"}, {"name": "Argent", "hex": "#C0C0C0"}]', ARRAY['https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80','https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'], true, false),

('Ceinture Logo Réversible', 'accessoires', 'Ceinture réversible 3.5cm. Face 1: cuir lisse noir. Face 2: toile monogrammée. Boucle logo dorée. Taille ajustable 75-105cm.', 165, 30, ARRAY['75','80','85','90','95','100','105'], '[{"name": "Noir/Marron", "hex": "#3D3D3D"}]', ARRAY['https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800&q=80','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'], true, false),

('Lunettes Soleil Aviateur', 'accessoires', 'Lunettes style aviateur. Monture métal doré, verres minéraux dégradés anti-UV400. Pont nasal ajustable. Livré avec étui cuir.', 225, 18, NULL, '[{"name": "Doré/Marron", "hex": "#D4AF37"}, {"name": "Argent/Gris", "hex": "#C0C0C0"}]', ARRAY['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80','https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80'], true, true),

('Lunettes Cat-Eye Vintage', 'accessoires', 'Lunettes cat-eye vintage. Monture acétate noire ou écaille, verres verts G15. Style retro chic. Protection UV400.', 195, 22, NULL, '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Écaille", "hex": "#8B4513"}]', ARRAY['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80','https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80'], true, false),

('Foulard Carré Soie 90x90', 'accessoires', 'Carré de soie twill 90x90cm. Impression artistique exclusive. Bords roulés main. Peut se porter de multiples façons.', 125, 35, NULL, '[{"name": "Multicolore", "hex": "#FF1493"}, {"name": "Marine", "hex": "#1B1B3A"}]', ARRAY['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80','https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80'], true, false),

('Montre Classic Or Rose', 'accessoires', 'Montre élégante bracelet cuir interchangeable. Cadran or rose 38mm, index diamants, mouvement quartz suisse. Verre saphir.', 425, 10, NULL, '[{"name": "Or Rose", "hex": "#B76E79"}, {"name": "Argent", "hex": "#C0C0C0"}]', ARRAY['https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80','https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80'], true, true),

('Portefeuille Compact Cuir', 'accessoires', 'Portefeuille compact en cuir nappa. 6 fentes cartes, compartiment billets, poche monnaie zip. 11x9cm. Finition main.', 145, 28, NULL, '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Cognac", "hex": "#9B4634"}, {"name": "Rouge", "hex": "#8B0000"}]', ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'], true, false),

('Écharpe Cachemire Extra Fine', 'accessoires', 'Écharpe en cachemire grade A, 70x200cm. Ultra légère et douce. Parfaite pour mi-saison. Plusieurs coloris.', 245, 18, NULL, '[{"name": "Grège", "hex": "#BEBEBE"}, {"name": "Camel", "hex": "#C19A6B"}, {"name": "Rose", "hex": "#E8C4C4"}]', ARRAY['https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80','https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&q=80'], true, false),

('Boucles Oreilles Perles', 'accessoires', 'Boucles d''oreilles pendantes en or 14k et perles d''eau douce AAA. Longueur 4cm. Fermoirs sécurisés.', 185, 15, NULL, '[{"name": "Or/Blanc", "hex": "#FFD700"}]', ARRAY['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80','https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'], true, true),

('Collier Choker Chaîne Or', 'accessoires', 'Choker chaîne en or 14k massif. Maille gourmette 3mm. Longueur ajustable 35-40cm. Élégant seul ou en layering.', 295, 12, NULL, '[{"name": "Or", "hex": "#FFD700"}, {"name": "Or Rose", "hex": "#B76E79"}]', ARRAY['https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80','https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80'], true, false),

('Bracelet Jonc Doré', 'accessoires', 'Bracelet jonc ouvert en laiton doré 18k. Diamètre 6cm, ouvrable. Minimaliste et chic. Porte seul ou accumulé.', 95, 40, NULL, '[{"name": "Or", "hex": "#FFD700"}]', ARRAY['https://images.unsplash.com/photo-1611591437281-460bfbe1220b?w=800&q=80','https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80'], true, false),

('Porte-Cartes Minimaliste', 'accessoires', 'Porte-cartes ultra fin en cuir italien. 4 fentes cartes. 10x7cm. Glisse facilement dans une poche.', 75, 35, NULL, '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Marron", "hex": "#8B4513"}, {"name": "Cognac", "hex": "#9B4634"}]', ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'], true, false),

('Chapeau Fedora Laine', 'accessoires', 'Fedora en laine feutrée. Bord moyen 6cm, crown classique. Ruban gros-grain. Style intemporel.', 165, 14, ARRAY['S','M','L'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Camel", "hex": "#C19A6B"}, {"name": "Gris", "hex": "#808080"}]', ARRAY['https://images.unsplash.com/photo-1514327605112-b887c0e61c0a?w=800&q=80','https://images.unsplash.com/photo-1575428652377-a269c9824e48?w=800&q=80'], true, false);

-- NOUVEAUTÉS (10 produits)
INSERT INTO products (name, category, description, price, stock, sizes, colors, images, is_active, is_new, is_featured) VALUES
('Ensemble Cachemire Cosy', 'nouveautes', 'Ensemble 2 pièces pull col roulé + pantalon droit en cachemire grade A. Ultra doux, coupe décontractée luxe. Parfait pour travailler à la maison avec élégance.', 465, 10, ARRAY['XS','S','M','L','XL'], '[{"name": "Gris", "hex": "#808080"}, {"name": "Beige", "hex": "#D4A574"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80','https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'], true, true, true),

('Cardigan Long Alpaga', 'nouveautes', 'Cardigan long en alpaga péruvien et laine mérinos. Coupe boyfriend oversize, poches plaquées, boutons corne. Chaleur naturelle exceptionnelle.', 325, 14, ARRAY['XS','S','M','L','XL'], '[{"name": "Camel", "hex": "#C19A6B"}, {"name": "Grège", "hex": "#BEBEBE"}]', ARRAY['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80','https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'], true, true, true),

('Robe Midi Plissée Champagne', 'nouveautes', 'Robe midi plissée en satin champagne. Col montant, manches longues ballons, taille élastiquée. Élégante pour le jour comme le soir.', 285, 18, ARRAY['XS','S','M','L','XL'], '[{"name": "Champagne", "hex": "#F7E7CE"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true, true),

('Manteau Sherling Écru', 'nouveautes', 'Manteau mi-long style sherling. Extérieur coton ciré, intérieur fourrure synthétique. Coupe oversize, cols larges. Chaud et tendance.', 485, 8, ARRAY['XS','S','M','L','XL'], '[{"name": "Écru", "hex": "#F5F5DC"}, {"name": "Marron", "hex": "#8B4513"}]', ARRAY['https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80','https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&q=80'], true, true, false),

('Pull Maille Torsadée Crème', 'nouveautes', 'Pull en maille torsadée épaisse, laine mérinos. Col roulé, coupe relaxée. Texture tricot artisanal. Chaleureux et confortable.', 225, 22, ARRAY['XS','S','M','L','XL','XXL'], '[{"name": "Crème", "hex": "#FFFDD0"}, {"name": "Gris", "hex": "#808080"}]', ARRAY['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80','https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80'], true, true, false),

('Veste Bomber Satin Olive', 'nouveautes', 'Bomber jacket en satin duchesse. Coupe classique, côtes aux poignets et à la taille. Brillant subtil. Style sporty luxe.', 265, 16, ARRAY['XS','S','M','L','XL'], '[{"name": "Olive", "hex": "#808000"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80','https://images.unsplash.com/photo-1594938298603-c8148c472f96?w=800&q=80'], true, true, false),

('Jupe Portefeuille Kaki', 'nouveautes', 'Jupe portefeuille midi en crêpe. Taille haute, lien à nouer. Fente latérale. Style working girl moderne.', 175, 20, ARRAY['XS','S','M','L','XL'], '[{"name": "Kaki", "hex": "#8B8B5E"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1583496661160-fb2053629817?w=800&q=80','https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80'], true, true, false),

('Top Drapé Manches Longues', 'nouveautes', 'Top en jersey stretch, effet drapé asymétrique. Manches longues, encolure bateau. Élégant et confortable pour tous les jours.', 135, 30, ARRAY['XS','S','M','L','XL'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Blanc", "hex": "#FFFFFF"}, {"name": "Terracotta", "hex": "#E2725B"}]', ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true, false),

('Pantalon Cargo Tailleur', 'nouveautes', 'Pantalon cargo revisité chic. Taille haute ajustée, larges poches plaquées. Jambe droite légèrement ample. Style utilitaire luxe.', 215, 18, ARRAY['XS','S','M','L','XL'], '[{"name": "Beige", "hex": "#D4A574"}, {"name": "Kaki", "hex": "#8B8B5E"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'], true, true, false),

('Blouse Imprimé Fleuri', 'nouveautes', 'Blouse fluide en crêpe de Chine, imprimé fleuri artistique. Col lavallière, poignets smockés. Romantique et moderne.', 165, 24, ARRAY['XS','S','M','L','XL'], '[{"name": "Multicolore", "hex": "#FF69B4"}]', ARRAY['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true, false);

-- SOLDES (8 produits en promotion)
INSERT INTO products (name, category, description, price, sale_price, stock, sizes, colors, images, is_active, is_sale) VALUES
('Robe Été Imprimée Floral', 'soldes', 'Robe midi fluide imprimé floral exclusif. Encolure V, manches courtes volantées. Prix original 225 USD. Collection printemps-été précédente.', 225, 112, 8, ARRAY['XS','S','M','L'], '[{"name": "Multicolore", "hex": "#FF69B4"}]', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true),

('Escarpins Classiques Cuir', 'soldes', 'Escarpins classiques en cuir nappa, talon 7cm confortable. Coupe arrondie élégante. Collection précédente. Prix original 265 USD.', 265, 132, 6, ARRAY['36','37','38','39','40','41'], '[{"name": "Nude", "hex": "#E8C4C4"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80','https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80'], true, true),

('Sac Bandoulière Chaîne', 'soldes', 'Sac bandoulière en cuir saffiano. Chaîne dorée et bandoulière cuir amovible. Collection précédente. Prix original 345 USD.', 345, 172, 5, NULL, '[{"name": "Rouge", "hex": "#8B0000"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&q=80','https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80'], true, true),

('Blouse Soie Imprimée', 'soldes', 'Blouse en soie imprimée géométrique. Coupe fluide, manches 3/4. Collection capsule limitée. Prix original 195 USD.', 195, 97, 10, ARRAY['XS','S','M','L','XL'], '[{"name": "Multicolore", "hex": "#FF1493"}]', ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&q=80'], true, true),

('Pantalon 7/8 Carotte', 'soldes', 'Pantalon 7/8 coupe carotte en coton stretch. Taille haute avec ceinture. Collection précédente. Prix original 155 USD.', 155, 77, 12, ARRAY['XS','S','M','L','XL'], '[{"name": "Blanc", "hex": "#FFFFFF"}, {"name": "Noir", "hex": "#0A0A0A"}, {"name": "Beige", "hex": "#D4A574"}]', ARRAY['https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80','https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80'], true, true),

('Portefeuille Long Zippé', 'soldes', 'Portefeuille long zippé en cuir italien. 12 fentes cartes, compartiments billets et monnaie. Collection précédente. Prix original 125 USD.', 125, 62, 8, NULL, '[{"name": "Cognac", "hex": "#9B4634"}, {"name": "Noir", "hex": "#0A0A0A"}]', ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'], true, true),

('Veste Jean Premium', 'soldes', 'Veste en denim premium, coupe boxy. Boutons dorés vieillis. Collection capsule. Prix original 185 USD.', 185, 92, 10, ARRAY['XS','S','M','L','XL'], '[{"name": "Denim", "hex": "#1560BD"}]', ARRAY['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80','https://images.unsplash.com/photo-1594938298603-c8148c472f96?w=800&q=80'], true, true),

('Robe Cocktail Dentelle', 'soldes', 'Robe cocktail en dentelle florale. Doublure satin, manches 3/4. Collection précédente. Prix original 275 USD.', 275, 137, 4, ARRAY['XS','S','M','L'], '[{"name": "Noir", "hex": "#0A0A0A"}, {"name": "Ivoire", "hex": "#FFFFF0"}]', ARRAY['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&q=80','https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80'], true, true);

-- ============================================
-- CREATE PRODUCT VARIANTS
-- ============================================

-- Add variants for clothing products with multiple colors/sizes
INSERT INTO product_variants (product_id, color, size, sku, stock, price_adjustment)
SELECT 
  p.id,
  'Noir',
  'M',
  CONCAT('VAR-', LEFT(p.id::text, 8), '-BLK-M'),
  FLOOR(p.stock * 0.3),
  0
FROM products p 
WHERE p.category = 'vetements' AND p.stock > 0
LIMIT 10;

-- ============================================
-- MARK SOME PRODUCTS AS FEATURED
-- ============================================

-- Already marked during insert with is_featured = true
-- Featured products: Robe Soie Noire, Pantalon Wide Leg, Blazer Noir, Trench, Pull Cachemire, Parfum Oud, Parfum Iris, Sac Mini, Lunettes Aviateur, Montre Or Rose, Ensemble Cachemire, Cardigan Alpaga

