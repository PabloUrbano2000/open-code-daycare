insert into public.daycares (id, name) values
  ('a2b2c2d2-0000-0000-0000-000000000001', 'Guardería Sala Soles'),
  ('a2b2c2d2-0000-0000-0000-000000000002', 'Guardería Los Girasoles'),
  ('a2b2c2d2-0000-0000-0000-000000000003', 'Guardería Las Estrellitas'),
  ('a2b2c2d2-0000-0000-0000-000000000004', 'Guardería Arcoíris')
on conflict (id) do nothing;