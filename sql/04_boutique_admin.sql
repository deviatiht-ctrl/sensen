-- ============================================================
-- SENSEN ACCESSORIES - 04_boutique_admin.sql
-- ============================================================
-- Run FOURTH. Chanje email lan pou email pa w anvan ou egzekite l.
-- Tab sa a rele boutique_admin_users_sensen : lot projet ki nan
-- menm baz done a PA gen menm admin ak Sensen Accessories.
-- ============================================================

INSERT INTO boutique_admin_users_sensen (email, full_name, role)
VALUES ('laurorejeanclarens0@gmail.com', 'Sensen Owner', 'owner')
ON CONFLICT (email) DO UPDATE
  SET role = 'owner', is_active = true;

-- Pou ajoute lot admin :
-- INSERT INTO boutique_admin_users_sensen (email, full_name, role) VALUES
--   ('admin2@example.com', 'Admin 2', 'admin')
-- ON CONFLICT (email) DO NOTHING;

-- Verifikasyon :
-- SELECT * FROM boutique_admin_users_sensen;
-- SELECT boutique_is_admin('laurorejeanclarens0@gmail.com');
