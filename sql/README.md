# Sensen Accessories - Base de donnees (Supabase)

Tout tab yo gen prefix **`boutique_`** pou pwojè sa a ka pataje menm baz done
Supabase ak yon lòt pwojè san konfli. Tab admin lan gen anplis yon sifiks
**`_sensen`** (`boutique_admin_users_sensen`) pou lòt pwojè a **pa gen menm
admin** ak Sensen Accessories.

## Lòd egzekisyon nan Supabase SQL Editor

| # | Fichye | Sa li fè |
|---|--------|----------|
| 1 | `01_boutique_schema.sql` | Tab, trigger, fonksyon (kategori yo rete **vid**) |
| 2 | `02_boutique_rls.sql` | RLS + tout policy + `boutique_is_admin()` |
| 3 | `03_boutique_storage.sql` | Bucket `boutique-products` ak `boutique-proofs` |
| 4 | `04_boutique_admin.sql` | Mete email admin ou (chanje l anvan!) |
| 5 | `05_boutique_seed.sql` | *Opsyonel* : katalog demo Sensen Accessories + mode paiement egzanp |
| 6 | `06_sensen_catalog.sql` | *Rekòmande* : katalog **reyel** la (326 pwodwi katalog WhatsApp +509 36 71 5753, pri an **HTG**) |

## Tab yo

- `boutique_store_settings` – non boutik, logo, livrezon
- `boutique_admin_users_sensen` – admin **sèlman pou Sensen**
- `boutique_categories` – **vid** apre install ; se admin ki kreye yo, epi yo
  monte otomatikman nan navigasyon ak filtè paj yo
- `boutique_products`, `boutique_product_variants`
- `boutique_customers`, `boutique_cart_items`
- `boutique_payment_methods` – mode paiement manuel (logo, tip, non kont,
  nimewo kont, enstriksyon, `requires_proof`)
- `boutique_orders` – commande + paiement + livrezon (`delivery_method`,
  `delivery_status`, `tracking_code`, `courier_name`...)
- `boutique_payment_proofs` – prev de paiement kliyan yo upload
- `boutique_order_tracking` – suivi livrezon (timeline evenman)
- `boutique_messages` – live chat

## Fonksyon itil

```sql
SELECT boutique_is_admin('email@example.com');
SELECT boutique_track_order('TRK-XXXXXXXXXX');   -- suivi piblik
SELECT boutique_unread_message_count('<user_uuid>');
```

## Ansyen fichye (obsolèt)

`01_schema.sql`, `02_rls.sql`, `03_storage.sql`, `04_admin.sql`,
`05_seed_products.sql`, `06_messages.sql`, `07_add_product_columns.sql`,
`08_fix_rls_products.sql`, `09_fix_rls_recursion.sql` se ansyen vèsyon san
prefix. Yo pa dwe roule ankò. Si ou te deja roule yo, ou ka efase ansyen tab
yo apre ou verifye done yo :

```sql
-- ATANSYON : sa efase done ansyen tab yo
DROP TABLE IF EXISTS cart_items, orders, product_variants, products,
  customers, admin_users, store_settings, messages CASCADE;
```
