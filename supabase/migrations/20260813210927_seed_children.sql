insert into public.children (id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status) values
  ('a2b2c2d2-0000-0000-0000-000000000201', 'a2b2c2d2-0000-0000-0000-000000000101', 'Mateo Fernández',  '2022-03-12', '2025-02-01', 'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.', '{peanut}',  true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000202', 'a2b2c2d2-0000-0000-0000-000000000101', 'Sofía Méndez',    '2024-11-04', '2025-03-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000203', 'a2b2c2d2-0000-0000-0000-000000000101', 'Benjamín Ruiz',   '2023-07-18', '2024-09-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000204', 'a2b2c2d2-0000-0000-0000-000000000102', 'Valentina Soto',  '2024-02-22', '2024-08-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000205', 'a2b2c2d2-0000-0000-0000-000000000102', 'Tomás Díaz',      '2022-09-09', '2024-03-01', 'Intolerancia a la lactosa. Evitar lácteos en desayuno y merienda.', '{lactose}', true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000206', 'a2b2c2d2-0000-0000-0000-000000000102', 'Emma Castro',     '2024-06-30', '2025-01-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000207', 'a2b2c2d2-0000-0000-0000-000000000103', 'Lucas Romero',    '2023-01-05', '2024-05-01', null, '{}',              true, 'active'),
  ('a2b2c2d2-0000-0000-0000-000000000208', 'a2b2c2d2-0000-0000-0000-000000000103', 'Olivia Vega',     '2023-12-14', '2024-03-01', null, '{}',              true, 'active')
on conflict (id) do nothing;